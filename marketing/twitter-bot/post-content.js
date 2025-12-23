#!/usr/bin/env node

/**
 * Post approved content to Twitter
 * Can run manually or as a cron job
 * Usage: npm run post:approved
 */

import { TwitterApi } from 'twitter-api-v2';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const QUEUE_DIR = join(__dirname, '../content-queue');
const APPROVED_FILE = join(QUEUE_DIR, 'approved.json');
const POSTED_FILE = join(QUEUE_DIR, 'posted.json');

const POSTING_INTERVAL_MS = (parseInt(process.env.POSTING_INTERVAL_HOURS) || 3) * 60 * 60 * 1000;

/**
 * Initialize Twitter client
 */
function initTwitterClient() {
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_ACCESS_TOKEN) {
    console.error('❌ Twitter API credentials not found in .env file');
    console.error('Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET');
    process.exit(1);
  }

  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
}

/**
 * Load approved content
 */
function loadApproved() {
  try {
    return JSON.parse(readFileSync(APPROVED_FILE, 'utf8'));
  } catch (error) {
    console.log('No approved content found.');
    return [];
  }
}

/**
 * Load posted content
 */
function loadPosted() {
  try {
    return JSON.parse(readFileSync(POSTED_FILE, 'utf8'));
  } catch (error) {
    return [];
  }
}

/**
 * Save posted content
 */
function savePosted(posted) {
  writeFileSync(POSTED_FILE, JSON.stringify(posted, null, 2));
}

/**
 * Save approved content
 */
function saveApproved(approved) {
  writeFileSync(APPROVED_FILE, JSON.stringify(approved, null, 2));
}

/**
 * Check if enough time has passed since last post
 */
function canPost(lastPosted) {
  if (!lastPosted) return true;
  const timeSince = Date.now() - new Date(lastPosted).getTime();
  return timeSince >= POSTING_INTERVAL_MS;
}

/**
 * Post a single tweet
 */
async function postTweet(client, text) {
  try {
    const result = await client.v2.tweet(text);
    return result.data.id;
  } catch (error) {
    console.error(`Error posting tweet: ${error.message}`);
    throw error;
  }
}

/**
 * Post a thread
 */
async function postThread(client, tweets) {
  const tweetIds = [];

  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i];

    try {
      let result;

      if (i === 0) {
        // First tweet
        result = await client.v2.tweet(tweet);
      } else {
        // Reply to previous tweet
        result = await client.v2.tweet(tweet, {
          reply: { in_reply_to_tweet_id: tweetIds[i - 1] }
        });
      }

      tweetIds.push(result.data.id);
      console.log(`  ✓ Posted tweet ${i + 1}/${tweets.length}`);

      // Small delay between thread tweets
      if (i < tweets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ✗ Failed at tweet ${i + 1}: ${error.message}`);
      throw error;
    }
  }

  return tweetIds;
}

/**
 * Main posting function
 */
async function postApproved(options = {}) {
  const { dryRun = false, force = false } = options;

  const approved = loadApproved();
  const posted = loadPosted();

  if (approved.length === 0) {
    console.log('📭 No approved content to post');
    return;
  }

  // Check if we can post
  const lastPosted = posted.length > 0 ? posted[posted.length - 1].postedAt : null;

  if (!force && !canPost(lastPosted)) {
    const nextPostTime = new Date(new Date(lastPosted).getTime() + POSTING_INTERVAL_MS);
    console.log(`⏳ Too soon to post. Next post time: ${nextPostTime.toLocaleString()}`);
    console.log(`   (${Math.ceil((nextPostTime - Date.now()) / 60000)} minutes remaining)`);
    console.log('\nUse --force to override');
    return;
  }

  // Get next item to post
  const item = approved[0];

  console.log('\n📤 Posting content...');
  console.log(`Theme: ${item.theme} | Format: ${item.format}`);
  console.log(`Type: ${item.isThread ? 'Thread' : 'Single tweet'}\n`);

  if (item.isThread) {
    item.tweets.forEach((tweet, i) => {
      console.log(`[${i + 1}/${item.tweets.length}] ${tweet}\n`);
    });
  } else {
    console.log(item.tweets[0]);
  }

  if (dryRun) {
    console.log('\n🧪 DRY RUN - Not actually posting');
    return;
  }

  try {
    const client = initTwitterClient();
    let tweetIds;

    if (item.isThread) {
      console.log('\nPosting thread...');
      tweetIds = await postThread(client, item.tweets);
    } else {
      console.log('\nPosting tweet...');
      const tweetId = await postTweet(client, item.tweets[0]);
      tweetIds = [tweetId];
    }

    // Record successful post
    const postedItem = {
      ...item,
      tweetIds,
      postedAt: new Date().toISOString(),
      url: `https://twitter.com/user/status/${tweetIds[0]}`
    };

    posted.push(postedItem);
    savePosted(posted);

    // Remove from approved queue
    approved.shift();
    saveApproved(approved);

    console.log(`\n✅ Posted successfully!`);
    console.log(`🔗 ${postedItem.url}`);
    console.log(`\nRemaining approved: ${approved.length}`);

  } catch (error) {
    console.error(`\n❌ Failed to post: ${error.message}`);
    process.exit(1);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  if (args.includes('--help')) {
    console.log(`
Usage: npm run post:approved [options]

Options:
  --dry-run    Show what would be posted without actually posting
  --force      Ignore posting interval and post immediately
  --help       Show this help message

Examples:
  npm run post:approved                # Post next item if interval has passed
  npm run post:approved -- --dry-run   # Preview without posting
  npm run post:approved -- --force     # Post immediately
    `);
    process.exit(0);
  }

  await postApproved({ dryRun, force });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { postApproved };
