#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_NAME="coldcopy"
TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)

echo "================================"
echo "Environment Check - $TIMESTAMP"
echo "================================"
echo ""

# Check 1: Verify ANTHROPIC_API_KEY is set in Cloudflare
echo "[1/3] Checking ANTHROPIC_API_KEY in Cloudflare Pages..."
if npx wrangler pages secret list --project-name "$PROJECT_NAME" | grep -q "ANTHROPIC_API_KEY"; then
  echo -e "${GREEN}✅${NC} ANTHROPIC_API_KEY is set in Cloudflare"
  ANTHROPIC_OK=true
else
  echo -e "${RED}❌${NC} ANTHROPIC_API_KEY is NOT set in Cloudflare"
  echo "   Run: npx wrangler pages secret put ANTHROPIC_API_KEY --project-name $PROJECT_NAME"
  ANTHROPIC_OK=false
fi
echo ""

# Check 2: Verify D1 database exists and is accessible
echo "[2/3] Checking D1 database..."
DB_ID="413b402d-f259-4b79-b7e4-3ab887c8a431"
if npx wrangler d1 info coldcopy-db 2>/dev/null | grep -q "Database"; then
  echo -e "${GREEN}✅${NC} D1 database 'coldcopy-db' exists"
  # Try a simple query to verify access
  if npx wrangler d1 execute coldcopy-db --command "SELECT 1" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} D1 database is accessible"
    DB_OK=true
  else
    echo -e "${YELLOW}⚠️${NC}  D1 database exists but query failed"
    DB_OK=false
  fi
else
  echo -e "${RED}❌${NC} D1 database 'coldcopy-db' not found"
  echo "   Database ID should be: $DB_ID"
  DB_OK=false
fi
echo ""

# Check 3: Verify KV namespace exists
echo "[3/3] Checking KV namespace..."
KV_ID="82359391e9704000a8d5f1efadf9b27f"
if npx wrangler kv namespace list 2>/dev/null | grep -q "RATE_LIMIT"; then
  echo -e "${GREEN}✅${NC} KV namespace 'RATE_LIMIT' exists"
  KV_OK=true
else
  echo -e "${RED}❌${NC} KV namespace 'RATE_LIMIT' not found"
  echo "   Namespace ID should be: $KV_ID"
  KV_OK=false
fi
echo ""

# Summary
echo "================================"
echo "Summary"
echo "================================"
if [ "$ANTHROPIC_OK" = true ] && [ "$DB_OK" = true ] && [ "$KV_OK" = true ]; then
  echo -e "${GREEN}✅ All environment checks passed${NC}"
  exit 0
else
  echo -e "${RED}❌ Some environment checks failed${NC}"
  echo ""
  echo "Fix the issues above before deploying."
  exit 1
fi
