#!/usr/bin/env node

/**
 * Simple CLI for reviewing and approving generated content
 * Usage: npm run review:content
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_DIR = join(__dirname, '../content-queue');
const QUEUE_FILE = join(QUEUE_DIR, 'pending.json');
const APPROVED_FILE = join(QUEUE_DIR, 'approved.json');
const REJECTED_FILE = join(QUEUE_DIR, 'rejected.json');

/**
 * Load queue
 */
function loadQueue() {
  try {
    return JSON.parse(readFileSync(QUEUE_FILE, 'utf8'));
  } catch (error) {
    console.error('No pending content found. Run: npm run generate:batch');
    process.exit(1);
  }
}

/**
 * Save queues
 */
function saveQueues(pending, approved, rejected) {
  writeFileSync(QUEUE_FILE, JSON.stringify(pending, null, 2));
  writeFileSync(APPROVED_FILE, JSON.stringify(approved, null, 2));
  writeFileSync(REJECTED_FILE, JSON.stringify(rejected, null, 2));
}

/**
 * Load approved/rejected or create empty arrays
 */
function loadApprovedRejected() {
  let approved = [];
  let rejected = [];

  try {
    approved = JSON.parse(readFileSync(APPROVED_FILE, 'utf8'));
  } catch (e) {
    // File doesn't exist yet
  }

  try {
    rejected = JSON.parse(readFileSync(REJECTED_FILE, 'utf8'));
  } catch (e) {
    // File doesn't exist yet
  }

  return { approved, rejected };
}

/**
 * Display content item
 */
function displayItem(item, index, total) {
  console.clear();
  console.log('='.repeat(80));
  console.log(`📝 Content Review [${index + 1}/${total}]`);
  console.log('='.repeat(80));
  console.log(`\nID: ${item.id}`);
  console.log(`Theme: ${item.theme} | Format: ${item.format}`);
  console.log(`Type: ${item.isThread ? 'Thread' : 'Single tweet'}`);
  console.log(`Created: ${new Date(item.createdAt).toLocaleString()}\n`);
  console.log('-'.repeat(80));

  if (item.isThread) {
    item.tweets.forEach((tweet, i) => {
      console.log(`\n[${i + 1}/${item.tweets.length}]`);
      console.log(tweet);
      console.log(`\n(${tweet.length} chars)`);
      if (i < item.tweets.length - 1) {
        console.log('\n' + '- '.repeat(40));
      }
    });
  } else {
    console.log(`\n${item.tweets[0]}`);
    console.log(`\n(${item.tweets[0].length} chars)`);
  }

  console.log('\n' + '-'.repeat(80));
}

/**
 * Get user input
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

/**
 * Review process
 */
async function reviewContent() {
  const pending = loadQueue();
  const { approved, rejected } = loadApprovedRejected();

  if (pending.length === 0) {
    console.log('✅ No pending content to review!');
    console.log(`Approved: ${approved.length} | Rejected: ${rejected.length}`);
    return;
  }

  console.log(`\n🔍 Found ${pending.length} items pending review\n`);

  let currentIndex = 0;
  const newApproved = [...approved];
  const newRejected = [...rejected];
  const remainingPending = [];

  while (currentIndex < pending.length) {
    const item = pending[currentIndex];
    displayItem(item, currentIndex, pending.length);

    const answer = await askQuestion(
      '\n[a]pprove | [r]eject | [e]dit | [s]kip | [q]uit: '
    );

    const choice = answer.toLowerCase().trim();

    if (choice === 'a') {
      item.approved = true;
      item.approvedAt = new Date().toISOString();
      newApproved.push(item);
      console.log('✅ Approved!');
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (choice === 'r') {
      item.rejected = true;
      item.rejectedAt = new Date().toISOString();
      newRejected.push(item);
      console.log('❌ Rejected!');
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (choice === 'e') {
      console.log('\n📝 Edit mode (paste edited content, then press Enter twice):');
      const lines = [];
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      let emptyLineCount = 0;
      for await (const line of rl) {
        if (line === '') {
          emptyLineCount++;
          if (emptyLineCount >= 2) break;
        } else {
          emptyLineCount = 0;
          lines.push(line);
        }
      }

      if (lines.length > 0) {
        const editedContent = lines.join('\n');
        const editedTweets = editedContent.split('---TWEET---')
          .map(t => t.trim())
          .filter(t => t);

        item.tweets = editedTweets;
        item.isThread = editedTweets.length > 1;
        item.edited = true;
        item.editedAt = new Date().toISOString();

        console.log('✏️ Content edited! Review again...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue; // Don't advance, review the edited version
      }
    } else if (choice === 's') {
      remainingPending.push(item);
      console.log('⏭️ Skipped');
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (choice === 'q') {
      console.log('\n👋 Saving progress and exiting...');
      // Add remaining items back to pending
      remainingPending.push(...pending.slice(currentIndex + 1));
      break;
    } else {
      console.log('Invalid choice. Try again.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue; // Don't advance
    }

    currentIndex++;
  }

  // Save updated queues
  saveQueues(remainingPending, newApproved, newRejected);

  console.log('\n' + '='.repeat(80));
  console.log('📊 Review Summary');
  console.log('='.repeat(80));
  console.log(`Approved: ${newApproved.length - approved.length} (Total: ${newApproved.length})`);
  console.log(`Rejected: ${newRejected.length - rejected.length} (Total: ${newRejected.length})`);
  console.log(`Pending: ${remainingPending.length}`);
  console.log('\nNext step: npm run post:approved');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  reviewContent().catch(console.error);
}

export { reviewContent };
