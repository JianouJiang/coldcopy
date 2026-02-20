#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="$SCRIPT_DIR/deploy-log-$(date +%Y%m%d-%H%M%S).txt"

echo "================================"
echo "ColdCopy Deploy & Verify"
echo "================================"
echo ""
echo "Log file: $LOG_FILE"
echo ""

# Function to log output
log() {
  echo "$1" | tee -a "$LOG_FILE"
}

# Make scripts executable
chmod +x "$SCRIPT_DIR/check-env.sh"
chmod +x "$SCRIPT_DIR/deploy.sh"
chmod +x "$SCRIPT_DIR/smoke-test.sh"

# Step 1: Environment Check
log ""
log "$(date +%Y-%m-%d\ %H:%M:%S) - Starting environment check..."
if "$SCRIPT_DIR/check-env.sh" 2>&1 | tee -a "$LOG_FILE"; then
  log "$(date +%Y-%m-%d\ %H:%M:%S) - ✅ Environment check passed"
else
  log "$(date +%Y-%m-%d\ %H:%M:%S) - ❌ Environment check failed"
  echo ""
  echo -e "${RED}Deployment cancelled.${NC}"
  echo "Fix the environment issues and try again."
  echo "See $LOG_FILE for details."
  exit 1
fi

# Step 2: Deploy
log ""
log "$(date +%Y-%m-%d\ %H:%M:%S) - Starting deployment..."
if "$SCRIPT_DIR/deploy.sh" 2>&1 | tee -a "$LOG_FILE"; then
  log "$(date +%Y-%m-%d\ %H:%M:%S) - ✅ Deployment succeeded"
else
  log "$(date +%Y-%m-%d\ %H:%M:%S) - ❌ Deployment failed"
  echo ""
  echo -e "${RED}Deployment failed.${NC}"
  echo "See $LOG_FILE for details."
  exit 1
fi

# Wait for deployment to propagate (Cloudflare Pages)
log ""
log "Waiting for deployment to propagate (20 seconds)..."
sleep 20

# Step 3: Smoke Tests
log ""
log "$(date +%Y-%m-%d\ %H:%M:%S) - Starting smoke tests..."
if "$SCRIPT_DIR/smoke-test.sh" 2>&1 | tee -a "$LOG_FILE"; then
  log "$(date +%Y-%m-%d\ %H:%M:%S) - ✅ All smoke tests passed"
else
  log "$(date +%Y-%m-%d\ %H:%M:%S) - ⚠️  Some smoke tests failed"
  echo ""
  echo -e "${YELLOW}⚠️  Smoke tests had failures, but deployment is live.${NC}"
  echo "See $LOG_FILE for details and investigate issues."
  exit 1
fi

# Success
log ""
log "================================"
log "✅ DEPLOYMENT SUCCESSFUL"
log "================================"
log ""
log "Production URL: https://1b41a14c.coldcopy-au3.pages.dev"
log ""
log "All checks passed:"
log "  ✅ Environment configured correctly"
log "  ✅ Frontend built and deployed"
log "  ✅ Cloudflare Pages deployment successful"
log "  ✅ Smoke tests passed"
log ""
log "ColdCopy is now live and ready to generate cold email sequences."
log ""
log "Log saved to: $LOG_FILE"
log ""

echo ""
echo -e "${GREEN}================================"
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "================================${NC}"
echo ""
echo "Production URL: https://1b41a14c.coldcopy-au3.pages.dev"
echo ""
echo "All checks passed. ColdCopy is live!"
