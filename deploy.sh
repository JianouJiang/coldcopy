#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="coldcopy"
TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)

echo "================================"
echo "ColdCopy Deployment - $TIMESTAMP"
echo "================================"
echo ""

# Get the production URL from wrangler (fallback to known URL)
PRODUCTION_URL="https://1b41a14c.coldcopy-au3.pages.dev"
echo "Production URL: $PRODUCTION_URL"
echo ""

# Step 1: Build frontend
echo "[1/2] Building frontend..."
if npm run build; then
  echo -e "${GREEN}✅${NC} Frontend build successful"
else
  echo -e "${RED}❌${NC} Frontend build failed"
  exit 1
fi
echo ""

# Step 2: Deploy to Cloudflare Pages
echo "[2/2] Deploying to Cloudflare Pages..."
if npx wrangler pages deploy frontend/dist --project-name "$PROJECT_NAME"; then
  echo -e "${GREEN}✅${NC} Deployment to Cloudflare Pages successful"
else
  echo -e "${RED}❌${NC} Deployment to Cloudflare Pages failed"
  exit 1
fi
echo ""

# Summary
echo "================================"
echo "Deployment Complete"
echo "================================"
echo -e "${GREEN}✅ ColdCopy is live!${NC}"
echo ""
echo "Production URL: $PRODUCTION_URL"
echo ""
echo "Next step: Run smoke tests"
echo "Command: ./smoke-test.sh"
