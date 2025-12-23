#!/usr/bin/env node

/**
 * Generate a batch of tweet content for review
 * Usage: npm run generate:batch
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  CONTENT_THEMES,
  TWEET_FORMATS,
  generateContentPrompt
} from './content-templates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10;
const QUEUE_DIR = join(__dirname, '../content-queue');

// Ensure queue directory exists
if (!existsSync(QUEUE_DIR)) {
  mkdirSync(QUEUE_DIR, { recursive: true });
}

/**
 * Select theme based on weights
 */
function selectTheme() {
  const random = Math.random();
  let cumulative = 0;

  for (const [theme, config] of Object.entries(CONTENT_THEMES)) {
    cumulative += config.weight;
    if (random <= cumulative) {
      return theme;
    }
  }

  return 'EDUCATIONAL'; // fallback
}

/**
 * Select random format
 */
function selectFormat() {
  return TWEET_FORMATS[Math.floor(Math.random() * TWEET_FORMATS.length)];
}

/**
 * Generate a single piece of content
 */
async function generateContent(index) {
  const theme = selectTheme();
  const format = selectFormat();

  console.log(`\n[${index + 1}/${BATCH_SIZE}] Generating ${format.name} for theme: ${theme}...`);

  try {
    const prompt = generateContentPrompt(theme, format);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text.trim();

    // Split into tweets if it's a thread
    const tweets = content.split('---TWEET---').map(t => t.trim()).filter(t => t);

    return {
      id: `tweet_${Date.now()}_${index}`,
      theme,
      format: format.name,
      tweets,
      isThread: tweets.length > 1,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
      approved: false
    };
  } catch (error) {
    console.error(`Error generating content: ${error.message}`);
    return null;
  }
}

/**
 * Main batch generation
 */
async function generateBatch() {
  console.log(`🤖 Generating batch of ${BATCH_SIZE} tweets...\n`);
  console.log('Distribution:');
  Object.entries(CONTENT_THEMES).forEach(([theme, config]) => {
    console.log(`  ${theme}: ${Math.round(config.weight * BATCH_SIZE)} tweets (${config.weight * 100}%)`);
  });

  const results = [];

  for (let i = 0; i < BATCH_SIZE; i++) {
    const content = await generateContent(i);
    if (content) {
      results.push(content);
      console.log(`✓ Generated: ${content.tweets[0].substring(0, 60)}...`);
    }

    // Rate limiting - be nice to the API
    if (i < BATCH_SIZE - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Load existing queue
  const queueFile = join(QUEUE_DIR, 'pending.json');
  let existingQueue = [];

  if (existsSync(queueFile)) {
    try {
      existingQueue = JSON.parse(readFileSync(queueFile, 'utf8'));
    } catch (error) {
      console.warn('Could not parse existing queue, starting fresh');
    }
  }

  // Append new content
  const updatedQueue = [...existingQueue, ...results];

  // Save to queue
  writeFileSync(queueFile, JSON.stringify(updatedQueue, null, 2));

  console.log(`\n✅ Generated ${results.length} pieces of content`);
  console.log(`📝 Total pending review: ${updatedQueue.length}`);
  console.log(`\nNext step: npm run review:content`);

  // Save summary
  const summary = {
    batchGeneratedAt: new Date().toISOString(),
    newItems: results.length,
    totalPending: updatedQueue.length,
    distribution: results.reduce((acc, item) => {
      acc[item.theme] = (acc[item.theme] || 0) + 1;
      return acc;
    }, {})
  };

  writeFileSync(
    join(QUEUE_DIR, `batch_${Date.now()}.json`),
    JSON.stringify(summary, null, 2)
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBatch().catch(console.error);
}

export { generateBatch };
