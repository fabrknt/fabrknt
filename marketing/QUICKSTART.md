# Marketing Automation - Quick Start Guide

Get your AI-powered marketing running in 15 minutes.

## Prerequisites

- Node.js 18+ installed
- Twitter/X account for Fabriquant
- Credit card for Anthropic API (pay-as-you-go)

## Step 1: API Keys (5 min)

### Anthropic API

1. Visit: https://console.anthropic.com/
2. Sign up / Sign in
3. Click "API Keys" → "Create Key"
4. Copy your key

**Cost**: ~$50-100/month for this use case

### Twitter API

1. Visit: https://developer.twitter.com/en/portal/dashboard
2. Create a new Project + App
3. User authentication settings:
   - OAuth 1.0a: **ON**
   - App permissions: **Read and Write and Direct Messages**
4. Keys and tokens:
   - Copy API Key & Secret
   - Generate Access Token & Secret
   - Copy both

**Cost**: Free

## Step 2: Install (2 min)

```bash
cd /Users/hiroyusai/src/fabriquant/marketing

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

Now edit `.env` and add your API keys:

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx...

# Twitter
TWITTER_API_KEY=xxxxx...
TWITTER_API_SECRET=xxxxx...
TWITTER_ACCESS_TOKEN=xxxxx...
TWITTER_ACCESS_SECRET=xxxxx...

# Config (can leave as-is)
CONTENT_REVIEW_MODE=true
BATCH_SIZE=10
POSTING_INTERVAL_HOURS=3
```

## Step 3: Build Knowledge Base (1 min)

```bash
npm run setup:kb
```

This creates a searchable knowledge base from your docs.

Expected output:
```
✅ Knowledge base built successfully!
   Documents: 10
   Code examples: 138
```

## Step 4: Test Content Generation (3 min)

```bash
# Generate 10 sample tweets
npm run generate:batch
```

Wait ~30 seconds while it generates content.

```bash
# Review the content
npm run review:content
```

Use keyboard to review:
- `a` = approve
- `r` = reject
- `s` = skip
- `q` = quit

**Approve at least 2-3 tweets for testing.**

## Step 5: Test Posting (2 min)

```bash
# Dry run (won't actually post)
npm run post:approved -- --dry-run
```

Check the output looks good.

```bash
# Post for real (this will post to Twitter!)
npm run post:approved -- --force
```

Check your Twitter - you should see the tweet!

## Step 6: Start DM Bot (2 min)

### Option A: One-time test

```bash
npm run dm:bot
```

Send a DM to your account asking "What is Fabriquant?" - check if it responds.

### Option B: Continuous (recommended)

```bash
# Install PM2 for background process
npm install -g pm2

# Start the bot
pm2 start dm-bot/responder.js --name fabriquant-dm-bot -- --continuous

# Check it's running
pm2 status

# View logs
pm2 logs fabriquant-dm-bot
```

The bot now runs 24/7 checking for DMs every 5 minutes.

## You're Done! 🎉

### Daily Workflow

**Monday mornings (30 min)**:
```bash
npm run generate:batch
npm run review:content
```

**Automated posting**:
- Posts happen automatically every 3 hours
- Or set up cron job (see main README)

**DM bot**:
- Running 24/7 via PM2
- Check logs weekly: `pm2 logs fabriquant-dm-bot`

## Quick Reference

| Task | Command |
|------|---------|
| Generate content | `npm run generate:batch` |
| Review content | `npm run review:content` |
| Post now | `npm run post:approved -- --force` |
| Check DMs once | `npm run dm:bot` |
| View PM2 logs | `pm2 logs fabriquant-dm-bot` |
| Rebuild KB | `npm run setup:kb` |

## Troubleshooting

**"Twitter API error"**
- Check all 4 Twitter credentials are in `.env`
- Verify app has Read+Write+DM permissions
- Regenerate access tokens if needed

**"Knowledge base not found"**
- Run `npm run setup:kb`

**Content quality is poor**
- Keep rejecting bad content - it learns
- Edit `twitter-bot/content-templates.js` to refine prompts
- Adjust temperature in `generate-batch.js` (lower = more consistent)

**DM bot not responding**
- Check `dm-bot/dm-state.json` for errors
- Verify DM permissions enabled on Twitter app
- Test with single run: `npm run dm:bot`

## Next Steps

1. Run for a week, review what content performs well
2. Adjust content templates based on your brand voice
3. Set up automation (cron or GitHub Actions)
4. Monitor costs in Anthropic console

See `README.md` for detailed documentation.

## Cost Tracking

Track your costs:
- **Anthropic**: https://console.anthropic.com/settings/usage
- **Twitter**: Free tier is plenty

Expected: $50-100/month total.

---

Questions? DM @psyto on X or file an issue.
