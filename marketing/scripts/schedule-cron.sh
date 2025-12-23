#!/bin/bash

# Helper script to set up cron jobs for marketing automation
# Usage: ./scripts/schedule-cron.sh

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🕐 Setting up cron jobs for Fabriquant marketing automation"
echo ""
echo "This will add the following cron jobs:"
echo ""
echo "1. Post approved content every 3 hours (8am-8pm)"
echo "   0 8,11,14,17,20 * * * cd $PROJECT_DIR && npm run post:approved"
echo ""
echo "2. Generate new content batch every Monday at 8am"
echo "   0 8 * * 1 cd $PROJECT_DIR && npm run generate:batch"
echo ""
echo "Note: You'll still need to manually review content with 'npm run review:content'"
echo ""

read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

# Create temporary cron file
TEMP_CRON=$(mktemp)

# Get existing crontab (if any)
crontab -l > "$TEMP_CRON" 2>/dev/null || true

# Check if our jobs already exist
if grep -q "fabriquant" "$TEMP_CRON"; then
    echo "⚠️  Fabriquant cron jobs already exist. Removing old ones..."
    grep -v "fabriquant" "$TEMP_CRON" > "${TEMP_CRON}.new"
    mv "${TEMP_CRON}.new" "$TEMP_CRON"
fi

# Add new jobs
echo "" >> "$TEMP_CRON"
echo "# Fabriquant Marketing Automation" >> "$TEMP_CRON"
echo "0 8,11,14,17,20 * * * cd $PROJECT_DIR && npm run post:approved >> $PROJECT_DIR/logs/cron-post.log 2>&1" >> "$TEMP_CRON"
echo "0 8 * * 1 cd $PROJECT_DIR && npm run generate:batch >> $PROJECT_DIR/logs/cron-generate.log 2>&1" >> "$TEMP_CRON"

# Install new crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

echo ""
echo "✅ Cron jobs installed successfully!"
echo ""
echo "To view your crontab: crontab -l"
echo "To remove these jobs: crontab -e (then delete the Fabriquant lines)"
echo ""
echo "Logs will be saved to:"
echo "  - $PROJECT_DIR/logs/cron-post.log"
echo "  - $PROJECT_DIR/logs/cron-generate.log"
echo ""
echo "Next steps:"
echo "1. Review and approve generated content: npm run review:content"
echo "2. Monitor logs: tail -f $PROJECT_DIR/logs/*.log"
