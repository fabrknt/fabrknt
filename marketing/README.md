# Fabriquant Marketing Automation

AI-powered marketing automation system for Fabriquant, optimized for bootstrap budget (<$300/month) and minimal time commitment (<2 hours/week).

## What This Does

This system provides two core capabilities:

1. **Twitter Content Engine**: Automatically generates, queues, and posts high-quality technical content
2. **AI Developer Advocate Bot**: Responds to technical questions via X/Twitter DMs 24/7

## Quick Start

### 1. Initial Setup

```bash
# Install dependencies
cd marketing
npm install

# Copy environment template
cp .env.example .env
```

### 2. Get API Keys

#### Anthropic API (for AI content generation)
1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Go to "API Keys" and create a new key
4. Add to `.env`: `ANTHROPIC_API_KEY=your_key_here`

**Cost estimate**: $50-100/month for moderate usage

#### Twitter/X API (for posting and DMs)
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new project and app
3. Enable OAuth 1.0a with Read + Write + Direct Messages permissions
4. Generate access tokens
5. Add all credentials to `.env`:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`

**Cost**: Free (Free tier is sufficient for this use case)

### 3. Build Knowledge Base

```bash
npm run setup:kb
```

This scans your project documentation and creates a searchable knowledge base for the AI bot.

### 4. Test the System

```bash
# Generate test content
npm run generate:batch

# Review generated content
npm run review:content

# Test posting (dry run)
npm run post:approved -- --dry-run
```

## Daily Workflow (< 2 hours/week)

### Twitter Content Engine

**Monday Morning (30 min)**:
```bash
# Generate content for the week
npm run generate:batch

# Review and approve (goes through each piece)
npm run review:content
```

**Throughout the week (automated)**:
Set up a cron job or use a service like GitHub Actions to post approved content automatically every 3 hours.

### DM Bot

**Run continuously** (minimal monitoring needed):
```bash
# Check for DMs once
npm run dm:bot

# Or run continuously (checks every 5 minutes)
npm run dm:bot -- --continuous
```

You can run this on a cheap VPS or even locally if you keep your computer on.

## Detailed Usage

### Twitter Content Engine

#### Generate Content

```bash
# Generate default batch (10 tweets)
npm run generate:batch

# The content is saved to content-queue/pending.json
```

Content follows this distribution:
- 30% Educational (code snippets, best practices)
- 25% Ecosystem engagement (Solana, Jupiter, AI agents)
- 20% Use cases and examples
- 15% Product updates
- 10% Thought leadership

#### Review Content

```bash
npm run review:content
```

Interactive CLI that lets you:
- **[a]pprove**: Queue for posting
- **[r]eject**: Discard (saved to rejected.json for analysis)
- **[e]dit**: Modify the content before approving
- **[s]kip**: Review later
- **[q]uit**: Save progress and exit

#### Post Content

```bash
# Post next approved item (respects 3-hour interval)
npm run post:approved

# Override interval and post immediately
npm run post:approved -- --force

# Preview without posting
npm run post:approved -- --dry-run
```

**Recommended**: Set up automated posting using cron or GitHub Actions.

#### Automation Setup (Cron)

Add to your crontab:

```bash
# Post approved content every 3 hours (8am-8pm)
0 8,11,14,17,20 * * * cd /path/to/fabriquant/marketing && npm run post:approved

# Generate new batch every Monday at 8am
0 8 * * 1 cd /path/to/fabriquant/marketing && npm run generate:batch
```

### DM Bot

#### One-time Check

```bash
npm run dm:bot
```

Processes all new DMs since last run.

#### Continuous Mode

```bash
# Check every 5 minutes (default)
npm run dm:bot -- --continuous

# Custom interval (e.g., every 10 minutes)
npm run dm:bot -- --continuous --interval=10
```

#### Run as Background Service

**Using PM2** (recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Start DM bot
pm2 start marketing/dm-bot/responder.js --name fabriquant-dm-bot -- --continuous

# View logs
pm2 logs fabriquant-dm-bot

# Auto-start on system reboot
pm2 startup
pm2 save
```

**Using screen** (simple alternative):

```bash
screen -S dm-bot
npm run dm:bot -- --continuous
# Press Ctrl+A, then D to detach
```

## File Structure

```
marketing/
├── twitter-bot/
│   ├── content-templates.js    # Content themes, formats, and prompts
│   ├── generate-batch.js       # Batch content generator
│   ├── review-queue.js         # Interactive review CLI
│   └── post-content.js         # Twitter posting logic
├── dm-bot/
│   ├── responder.js            # DM response bot
│   └── dm-state.json           # Conversation history (auto-generated)
├── knowledge-base/
│   ├── build-kb.js             # KB builder script
│   └── knowledge-base.json     # Searchable KB (auto-generated)
├── content-queue/
│   ├── pending.json            # Generated content awaiting review
│   ├── approved.json           # Approved content ready to post
│   ├── posted.json             # Posted content archive
│   └── rejected.json           # Rejected content for analysis
├── package.json
├── .env                        # API keys (create from .env.example)
└── README.md                   # This file
```

## Configuration

Edit `.env` to customize:

```bash
# Review mode (set to false for auto-posting - not recommended)
CONTENT_REVIEW_MODE=true

# Number of tweets to generate per batch
BATCH_SIZE=10

# Hours between posts
POSTING_INTERVAL_HOURS=3
```

## Cost Breakdown

**Monthly costs (estimate)**:

| Service | Cost | Usage |
|---------|------|-------|
| Anthropic API | $50-100 | ~50-100 generated tweets + DM responses |
| Twitter API | Free | Free tier is sufficient |
| **Total** | **$50-100/month** | Well under $300 budget |

**Time commitment**:

| Task | Frequency | Time |
|------|-----------|------|
| Review & approve content | Weekly | 30-45 min |
| Monitor DM bot | Weekly | 15-30 min |
| System maintenance | Monthly | 30 min |
| **Total** | **Weekly** | **~1-1.5 hours** |

## Tips for Success

### Content Quality
- Review first 2-3 batches carefully to understand AI output quality
- Reject generic or promotional content - keep it technical and valuable
- Edit when needed - the AI gets better with feedback over time
- Mix formats: threads, code snippets, questions, hot takes

### Engagement Strategy
- Reply to responses manually (AI-generated content, human engagement)
- Use approved content as conversation starters
- Share content in relevant Discord/Telegram channels
- Tag relevant accounts (Jupiter, Solana devs) when appropriate

### DM Bot Best Practices
- Review conversation history weekly in `dm-bot/dm-state.json`
- If you see repeated questions, update documentation
- The bot is humble - it admits when it doesn't know and points to docs
- You can always jump in manually for complex questions

### Optimization
- After first month, analyze `rejected.json` to see what you don't like
- Update `content-templates.js` to refine themes and formats
- Adjust `BATCH_SIZE` based on approval rate
- Monitor `posted.json` for engagement metrics (manual for now)

## Troubleshooting

### "No matching version found for anthropic"
- Make sure you're using `@anthropic-ai/sdk` not `anthropic`
- Run `npm install` again

### "Twitter API credentials not found"
- Check that all 4 Twitter credentials are in `.env`
- Make sure there are no spaces around the `=` signs
- Verify credentials have Read + Write + DM permissions

### "Knowledge base not found"
- Run `npm run setup:kb` to build it
- If it fails, check that project documentation exists

### Content generation is slow
- Normal - each tweet takes 2-3 seconds due to rate limiting
- Batch generation of 10 tweets takes ~30 seconds
- This prevents API rate limit issues

### DM bot not responding
- Check `dm-bot/dm-state.json` for errors
- Verify Twitter API permissions include Direct Messages
- Test with `npm run dm:bot` (single run) first
- Check logs if running via PM2: `pm2 logs fabriquant-dm-bot`

## Advanced: GitHub Actions Automation

For fully automated posting without a server, use GitHub Actions:

1. Add secrets to your GitHub repo:
   - `ANTHROPIC_API_KEY`
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`

2. Create `.github/workflows/twitter-bot.yml`:

```yaml
name: Twitter Content Bot

on:
  schedule:
    # Post every 3 hours from 8am-8pm UTC
    - cron: '0 8,11,14,17,20 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  post-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd marketing
          npm install

      - name: Post approved content
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TWITTER_API_KEY: ${{ secrets.TWITTER_API_KEY }}
          TWITTER_API_SECRET: ${{ secrets.TWITTER_API_SECRET }}
          TWITTER_ACCESS_TOKEN: ${{ secrets.TWITTER_ACCESS_TOKEN }}
          TWITTER_ACCESS_SECRET: ${{ secrets.TWITTER_ACCESS_SECRET }}
        run: |
          cd marketing
          npm run post:approved

      - name: Commit updated queues
        run: |
          git config --global user.name 'GitHub Actions'
          git config --global user.email 'actions@github.com'
          git add marketing/content-queue/
          git diff --quiet && git diff --staged --quiet || git commit -m "Update content queues [skip ci]"
          git push
```

This fully automates posting while keeping your approval workflow local.

## Next Steps

1. **Week 1**: Get familiar with the system, review carefully
2. **Week 2**: Adjust templates based on what works
3. **Week 3**: Set up automation (cron/PM2/GitHub Actions)
4. **Week 4**: Analyze engagement, optimize

## Support

- Issues: File in main repo or ask the DM bot (meta!)
- Questions: Twitter DMs to @psyto
- Contributions: PRs welcome

---

Built with ❤️ and Claude Sonnet 4.5
