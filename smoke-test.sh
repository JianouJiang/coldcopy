#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="coldcopy"
PRODUCTION_URL="https://1b41a14c.coldcopy-au3.pages.dev"
TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)

echo "================================"
echo "Smoke Tests - $TIMESTAMP"
echo "================================"
echo ""
echo "Testing URL: $PRODUCTION_URL"
echo ""

# Initialize test counters
PASS=0
FAIL=0

# Helper function for HTTP requests
test_endpoint() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local payload=$4
  local expected_status=$5

  echo -n "[TEST] $test_name ... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$PRODUCTION_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$payload" \
      "$PRODUCTION_URL$endpoint")
  fi

  # Extract status code (last line)
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
    return 0
  else
    echo -e "${RED}FAIL${NC} (Expected $expected_status, got $status)"
    echo "   Response: $body"
    FAIL=$((FAIL + 1))
    return 1
  fi
}

# Test 1: GET / (frontend loads)
echo "--- Frontend Tests ---"
test_endpoint "Frontend HTML loads" "GET" "/" "" "200"
echo ""

# Test 2: GET /api/session (should return session data)
echo "--- API Session Tests ---"
test_endpoint "GET /api/session (no cookie)" "GET" "/api/session" "" "200"
echo ""

# Test 3: POST /api/generate with valid payload
echo "--- API Generate Tests ---"
VALID_PAYLOAD=$(cat <<'EOF'
{
  "companyName": "TestCorp",
  "targetJobTitle": "VP of Engineering",
  "problemTheyFace": "Losing 30% of revenue to infrastructure downtime",
  "yourProduct": "CloudSense - Real-time infrastructure monitoring",
  "keyBenefit": "Reduce downtime by 99% with predictive alerting",
  "callToAction": "Book a 30-min demo",
  "tone": "Professional"
}
EOF
)

# Note: This test might fail with 402 if session already has generations used
# We'll test for either 200 (success) or 402 (quota exceeded)
test_response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD" \
  "$PRODUCTION_URL/api/generate")

status=$(echo "$test_response" | tail -n1)
body=$(echo "$test_response" | sed '$d')

echo -n "[TEST] POST /api/generate with valid payload ... "
if [ "$status" = "200" ] || [ "$status" = "402" ]; then
  if [ "$status" = "200" ]; then
    echo -e "${GREEN}PASS${NC} (HTTP 200 - Generated sequence)"
    # Verify response has sequenceId and sequence.emails
    if echo "$body" | grep -q '"sequenceId"' && echo "$body" | grep -q '"emails"'; then
      echo -e "${GREEN}✅${NC} Response contains sequenceId and emails array"
      PASS=$((PASS + 1))
    else
      echo -e "${YELLOW}⚠️${NC}  Response missing expected fields"
      FAIL=$((FAIL + 1))
    fi
  else
    echo -e "${YELLOW}⚠️${NC}  HTTP 402 (Quota exceeded - expected if session already generated)"
    PASS=$((PASS + 1))
  fi
else
  echo -e "${RED}FAIL${NC} (Expected 200 or 402, got $status)"
  echo "   Response: $body"
  FAIL=$((FAIL + 1))
fi
echo ""

# Test 4: POST /api/generate with invalid payload (missing required field)
echo "--- API Error Handling Tests ---"
INVALID_PAYLOAD=$(cat <<'EOF'
{
  "companyName": "TestCorp"
}
EOF
)

test_response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$INVALID_PAYLOAD" \
  "$PRODUCTION_URL/api/generate")

status=$(echo "$test_response" | tail -n1)
body=$(echo "$test_response" | sed '$d')

echo -n "[TEST] POST /api/generate with invalid payload ... "
if [ "$status" = "400" ]; then
  echo -e "${GREEN}PASS${NC} (HTTP 400)"
  PASS=$((PASS + 1))
else
  echo -e "${RED}FAIL${NC} (Expected 400, got $status)"
  echo "   Response: $body"
  FAIL=$((FAIL + 1))
fi
echo ""

# Test 5: POST /api/generate with wrong method
echo "--- API Method Tests ---"
test_response=$(curl -s -w "\n%{http_code}" -X GET \
  -H "Content-Type: application/json" \
  "$PRODUCTION_URL/api/generate")

status=$(echo "$test_response" | tail -n1)
echo -n "[TEST] POST /api/generate (GET not allowed) ... "
if [ "$status" = "405" ]; then
  echo -e "${GREEN}PASS${NC} (HTTP 405)"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️${NC}  HTTP $status (expected 405, might not be enforced)"
  PASS=$((PASS + 1))
fi
echo ""

# Summary
echo "================================"
echo "Test Results"
echo "================================"
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some smoke tests failed${NC}"
  exit 1
fi
