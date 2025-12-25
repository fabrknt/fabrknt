#!/usr/bin/env node

/**
 * AI-powered DM responder for X/Twitter
 * Responds to technical questions about Fabriquant
 */

import Anthropic from '@anthropic-ai/sdk';
import { TwitterApi } from 'twitter-api-v2';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const KB_FILE = join(__dirname, '../knowledge-base/knowledge-base.json');
const STATE_FILE = join(__dirname, 'dm-state.json');

/**
 * Load knowledge base
 */
function loadKnowledgeBase() {
  if (!existsSync(KB_FILE)) {
    console.error('❌ Knowledge base not found. Run: npm run setup:kb');
    process.exit(1);
  }

  return JSON.parse(readFileSync(KB_FILE, 'utf8'));
}

/**
 * Load/save bot state (last processed DM, etc.)
 */
function loadState() {
  if (!existsSync(STATE_FILE)) {
    return { lastProcessedDmId: null, conversationHistory: {} };
  }
  return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Initialize clients
 */
function initClients() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const twitter = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  return { anthropic, twitter };
}

/**
 * Build system prompt with knowledge base context
 */
function buildSystemPrompt(kb) {
  return `You are an AI assistant for Fabriquant, a precision execution stack for Solana development.

Your role:
- Answer technical questions about Fabriquant and its components
- Provide code examples when helpful
- Guide developers to the right documentation
- Be helpful, concise, and technically accurate
- Keep responses under 1000 characters (DM length limit)
- If you don't know something, be honest and point to documentation

Project Overview:
${kb.quickFacts.purpose}

Core Components:
${kb.quickFacts.coreComponents.map(c => `- ${c}`).join('\n')}

Key Features:
${kb.quickFacts.keyFeatures.map(f => `- ${f}`).join('\n')}

Installation: ${kb.quickFacts.installation}
Repository: ${kb.quickFacts.repository}

Response Guidelines:
1. Be friendly but professional
2. Use code snippets when relevant (keep them short)
3. Always provide links to docs for deeper learning
4. If asked about competitors, focus on Fabriquant's unique value
5. If asked about support, point to GitHub issues or community channels
6. Never make up features or capabilities - stick to documented facts

Document Summaries:
${kb.documents.map(doc => `- ${doc.title} (${doc.path})`).join('\n')}

Remember: You're representing an open-source project. Be welcoming to newcomers and helpful to experienced developers alike.`;
}

/**
 * Generate response using Claude
 */
async function generateResponse(anthropic, systemPrompt, conversationHistory, newMessage) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: newMessage }
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages
    });

    const reply = response.content[0].text;

    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: newMessage },
      { role: 'assistant', content: reply }
    );

    // Keep only last 10 messages to manage context
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    return { reply, conversationHistory };
  } catch (error) {
    console.error(`Error generating response: ${error.message}`);
    return {
      reply: "I'm having trouble processing your message right now. Please check our documentation at https://github.com/fabrknt/fabrknt or try again later.",
      conversationHistory
    };
  }
}

/**
 * Check for new DMs and respond
 */
async function processDMs() {
  console.log('🤖 Starting DM bot...\n');

  const { anthropic, twitter } = initClients();
  const kb = loadKnowledgeBase();
  const state = loadState();
  const systemPrompt = buildSystemPrompt(kb);

  console.log('✓ Loaded knowledge base');
  console.log(`✓ Documents: ${kb.metadata.documentCount}`);
  console.log(`✓ Code examples: ${kb.metadata.codeExampleCount}\n`);

  try {
    // Get DM events
    const dmEvents = await twitter.v2.listDmEvents({
      max_results: 20,
      'dm_event.fields': ['created_at', 'sender_id', 'text']
    });

    if (!dmEvents.data || dmEvents.data.data.length === 0) {
      console.log('📭 No new DMs');
      return;
    }

    // Get authenticated user ID
    const me = await twitter.v2.me();
    const myId = me.data.id;

    // Filter for received DMs only (not sent by us)
    const receivedDMs = dmEvents.data.data
      .filter(dm => dm.sender_id !== myId)
      .filter(dm => !state.lastProcessedDmId || dm.id > state.lastProcessedDmId);

    if (receivedDMs.length === 0) {
      console.log('📭 No new DMs to process');
      return;
    }

    console.log(`📬 Found ${receivedDMs.length} new DM(s)\n`);

    // Process each DM
    for (const dm of receivedDMs) {
      const senderId = dm.sender_id;
      const message = dm.text;

      console.log(`From: ${senderId}`);
      console.log(`Message: ${message}\n`);

      // Get or initialize conversation history for this user
      if (!state.conversationHistory[senderId]) {
        state.conversationHistory[senderId] = [];
      }

      // Generate response
      console.log('Generating response...');
      const { reply, conversationHistory } = await generateResponse(
        anthropic,
        systemPrompt,
        state.conversationHistory[senderId],
        message
      );

      state.conversationHistory[senderId] = conversationHistory;

      console.log(`Reply: ${reply}\n`);

      // Send response
      try {
        await twitter.v2.sendDmToParticipant(senderId, { text: reply });
        console.log('✓ Response sent\n');
      } catch (error) {
        console.error(`✗ Failed to send DM: ${error.message}\n`);
      }

      // Update last processed ID
      state.lastProcessedDmId = dm.id;
      saveState(state);

      // Rate limiting - be nice to the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('✅ DM processing complete');

  } catch (error) {
    console.error(`Error processing DMs: ${error.message}`);
    if (error.data) {
      console.error('API Error:', JSON.stringify(error.data, null, 2));
    }
  }
}

/**
 * Run bot in continuous mode
 */
async function runContinuous(intervalMinutes = 5) {
  console.log(`🔄 Running in continuous mode (checking every ${intervalMinutes} minutes)\n`);
  console.log('Press Ctrl+C to stop\n');

  while (true) {
    await processDMs();
    console.log(`\n⏳ Waiting ${intervalMinutes} minutes until next check...\n`);
    await new Promise(resolve => setTimeout(resolve, intervalMinutes * 60 * 1000));
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Usage: npm run dm:bot [options]

Options:
  --continuous     Run continuously (check every 5 minutes)
  --interval=N     Set check interval in minutes (use with --continuous)
  --help          Show this help message

Examples:
  npm run dm:bot                      # Check once and exit
  npm run dm:bot -- --continuous      # Run continuously
  npm run dm:bot -- --continuous --interval=10  # Check every 10 minutes
    `);
    process.exit(0);
  }

  const continuous = args.includes('--continuous');
  const intervalArg = args.find(arg => arg.startsWith('--interval='));
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) : 5;

  if (continuous) {
    await runContinuous(interval);
  } else {
    await processDMs();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { processDMs, runContinuous };
