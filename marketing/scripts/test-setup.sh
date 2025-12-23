#!/bin/bash

# Test script to verify marketing automation setup
# Usage: ./scripts/test-setup.sh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🧪 Testing Fabriquant Marketing Automation Setup"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    test_pass "Node.js version: $(node -v)"
else
    test_fail "Node.js version too old: $(node -v) (need 18+)"
fi
echo ""

# Test 2: Dependencies installed
echo "Checking dependencies..."
if [ -d "$PROJECT_DIR/node_modules" ]; then
    test_pass "Dependencies installed"
else
    test_fail "Dependencies not installed. Run: npm install"
fi
echo ""

# Test 3: Environment file
echo "Checking environment configuration..."
if [ -f "$PROJECT_DIR/.env" ]; then
    test_pass ".env file exists"

    # Check for required keys
    if grep -q "ANTHROPIC_API_KEY=" "$PROJECT_DIR/.env"; then
        if grep -q "ANTHROPIC_API_KEY=your_" "$PROJECT_DIR/.env"; then
            test_warn "ANTHROPIC_API_KEY not configured (still using placeholder)"
        else
            test_pass "ANTHROPIC_API_KEY configured"
        fi
    else
        test_fail "ANTHROPIC_API_KEY not found in .env"
    fi

    if grep -q "TWITTER_API_KEY=" "$PROJECT_DIR/.env"; then
        if grep -q "TWITTER_API_KEY=your_" "$PROJECT_DIR/.env"; then
            test_warn "TWITTER_API_KEY not configured (still using placeholder)"
        else
            test_pass "Twitter API keys configured"
        fi
    else
        test_fail "Twitter API keys not found in .env"
    fi
else
    test_fail ".env file not found. Copy from .env.example"
fi
echo ""

# Test 4: Knowledge base
echo "Checking knowledge base..."
if [ -f "$PROJECT_DIR/knowledge-base/knowledge-base.json" ]; then
    test_pass "Knowledge base exists"

    # Check KB is not empty
    KB_SIZE=$(stat -f%z "$PROJECT_DIR/knowledge-base/knowledge-base.json" 2>/dev/null || stat -c%s "$PROJECT_DIR/knowledge-base/knowledge-base.json" 2>/dev/null)
    if [ "$KB_SIZE" -gt 1000 ]; then
        test_pass "Knowledge base is populated (${KB_SIZE} bytes)"
    else
        test_warn "Knowledge base seems empty. Run: npm run setup:kb"
    fi
else
    test_fail "Knowledge base not found. Run: npm run setup:kb"
fi
echo ""

# Test 5: Directory structure
echo "Checking directory structure..."
REQUIRED_DIRS=(
    "twitter-bot"
    "dm-bot"
    "knowledge-base"
    "content-queue"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$PROJECT_DIR/$dir" ]; then
        test_pass "$dir/ exists"
    else
        test_fail "$dir/ directory missing"
    fi
done
echo ""

# Test 6: Scripts are executable
echo "Checking scripts..."
REQUIRED_SCRIPTS=(
    "twitter-bot/generate-batch.js"
    "twitter-bot/review-queue.js"
    "twitter-bot/post-content.js"
    "dm-bot/responder.js"
    "knowledge-base/build-kb.js"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$PROJECT_DIR/$script" ]; then
        test_pass "$script exists"
    else
        test_fail "$script missing"
    fi
done
echo ""

# Summary
echo "================================================"
echo "Test Summary"
echo "================================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Your setup looks good.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Make sure API keys are configured in .env"
    echo "2. Generate test content: npm run generate:batch"
    echo "3. Review content: npm run review:content"
    echo "4. Test posting: npm run post:approved -- --dry-run"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Missing dependencies: npm install"
    echo "- Missing .env: cp .env.example .env"
    echo "- Missing KB: npm run setup:kb"
    echo ""
    exit 1
fi
