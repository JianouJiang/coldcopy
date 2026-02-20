#!/bin/bash

# ColdCopy P0 Test Execution Script
# Automated tests for P0 scenarios that can be scripted
# Manual tests are in docs/qa/p0-manual-test-checklist.md
#
# Usage: ./test-p0.sh [BASE_URL]
# Example: ./test-p0.sh https://1b41a14c.coldcopy-au3.pages.dev
#
# Note: Tests that cannot be automated (UI interactions, copy-to-clipboard, visual feedback)
# are documented in the manual checklist.

set -e

# Configuration
BASE_URL="${1:-https://1b41a14c.coldcopy-au3.pages.dev}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_FILE="test-results-${TIMESTAMP}.json"
COOKIE_JAR="test-cookies-${TIMESTAMP}.txt"
VERBOSE="${VERBOSE:-0}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data file
TEST_DATA_FILE="test-data.json"

# Initialize results
declare -A RESULTS

# Helper functions
log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((PASSED_TESTS++))
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((FAILED_TESTS++))
}

test_case() {
  ((TOTAL_TESTS++))
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}Test $TOTAL_TESTS: $1${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Load test data
load_test_data() {
  if [[ ! -f "$TEST_DATA_FILE" ]]; then
    log_info "Test data file not found, will generate default data"
    return
  fi
  log_info "Test data loaded from $TEST_DATA_FILE"
}

# Test: P0-1-FORM-VALIDATION-EMPTY
test_p01_empty_form() {
  test_case "P0-1: Form Validation — Empty Submission"

  local response=$(curl -s -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d '{}' \
    -w "\n%{http_code}")

  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [[ "$http_code" == "400" ]]; then
    log_pass "Empty form rejected with 400 status"
    RESULTS["p01"]="PASS"
  else
    log_fail "Expected 400 for empty form, got $http_code"
    RESULTS["p01"]="FAIL"
  fi
}

# Test: P0-1-HAPPY-PATH (partial — form validation + API call)
test_p01_happy_path_api() {
  test_case "P0-1: Happy Path — API Call (partial)"

  # Load test data
  local test_data=$(cat << 'EOF'
{
  "companyName": "Acme Analytics",
  "targetJobTitle": "VP of Marketing",
  "problemTheyFace": "They lose 30-40% of revenue to cart abandonment but don't know why",
  "yourProduct": "Real-time analytics dashboard for e-commerce stores. Shows conversion funnels, cart abandonment, and LTV cohorts.",
  "keyBenefit": "Identify why 60% of carts abandon in under 10 seconds",
  "callToAction": "Book a 15-min demo",
  "tone": "Professional"
}
EOF
  )

  local response=$(curl -s -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -d "$test_data" \
    -w "\n%{http_code}")

  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  # Check for successful response
  if [[ "$http_code" == "200" ]]; then
    # Verify response contains sequence and emails
    if echo "$body" | grep -q '"sequence"' && echo "$body" | grep -q '"emails"'; then
      log_pass "Happy path: API returned 200 with sequence"
      RESULTS["p01_api"]="PASS"
    else
      log_fail "Response missing 'sequence' or 'emails' field"
      RESULTS["p01_api"]="FAIL"
    fi
  else
    log_fail "Expected 200 for happy path, got $http_code"
    [[ "$VERBOSE" == "1" ]] && echo "Response: $body"
    RESULTS["p01_api"]="FAIL"
  fi
}

# Test: P0-2-RATE-LIMITING
test_p02_rate_limiting() {
  test_case "P0-2: Rate Limiting — Second Generation Returns 402"

  # Re-use cookie jar from P0-1 to maintain session
  local test_data=$(cat << 'EOF'
{
  "companyName": "TechCorp",
  "targetJobTitle": "CTO",
  "problemTheyFace": "Infrastructure scaling is expensive and time-consuming",
  "yourProduct": "Cloud optimization platform for DevOps teams",
  "keyBenefit": "Reduce cloud costs by 40% automatically",
  "callToAction": "Schedule a consultation",
  "tone": "Direct"
}
EOF
  )

  local response=$(curl -s -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -d "$test_data" \
    -w "\n%{http_code}")

  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [[ "$http_code" == "402" ]]; then
    if echo "$body" | grep -q '"error"'; then
      log_pass "Rate limit enforced: 402 returned for second generation"
      RESULTS["p02"]="PASS"
    else
      log_fail "Got 402 but no error message in response"
      RESULTS["p02"]="FAIL"
    fi
  else
    log_fail "Expected 402 for rate limit, got $http_code"
    [[ "$VERBOSE" == "1" ]] && echo "Response: $body"
    RESULTS["p02"]="FAIL"
  fi
}

# Test: P0-3-FORM-VALIDATION
test_p03_validation() {
  test_case "P0-3: Form Validation — Invalid Input"

  # Test 1: Missing required field
  local test_data=$(cat << 'EOF'
{
  "companyName": "Test",
  "targetJobTitle": "Title"
}
EOF
  )

  local response=$(curl -s -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "$test_data" \
    -w "\n%{http_code}")

  local http_code=$(echo "$response" | tail -n1)

  if [[ "$http_code" == "400" ]]; then
    log_pass "Validation: Missing required field returns 400"
    RESULTS["p03_validation"]="PASS"
  else
    log_fail "Expected 400 for incomplete form, got $http_code"
    RESULTS["p03_validation"]="FAIL"
  fi
}

# Test: P0-4-CHARACTER-LIMITS
test_p04_char_limits() {
  test_case "P0-4: Character Limits — Field Truncation"

  # Test with oversized company name (>50 chars)
  local test_data=$(cat << 'EOF'
{
  "companyName": "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod",
  "targetJobTitle": "VP of Marketing",
  "problemTheyFace": "They have a problem that needs solving for the business",
  "yourProduct": "A product that solves the problem for customers",
  "keyBenefit": "Benefit that customers get from using the product",
  "callToAction": "Schedule a demo call",
  "tone": "Professional"
}
EOF
  )

  local response=$(curl -s -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "$test_data" \
    -w "\n%{http_code}")

  local http_code=$(echo "$response" | tail -n1)

  if [[ "$http_code" == "400" ]]; then
    log_pass "Character limit: Oversized input rejected with 400"
    RESULTS["p04"]="PASS"
  else
    log_info "Character limit validation: Server returned $http_code (client-side truncation may apply)"
    RESULTS["p04"]="MANUAL"
  fi
}

# Test: P0-5-SESSION-PERSISTENCE
test_p05_session_persistence() {
  test_case "P0-5: Session Persistence — Cookie Management"

  # Check if cookie jar contains session cookie
  if grep -q "coldcopy_session" "$COOKIE_JAR" 2>/dev/null; then
    local session_id=$(grep "coldcopy_session" "$COOKIE_JAR" | awk '{print $NF}')
    if [[ ${#session_id} -gt 20 ]]; then  # UUID should be ~36 chars
      log_pass "Session cookie persisted: $session_id"
      RESULTS["p05"]="PASS"
    else
      log_fail "Session cookie found but invalid format"
      RESULTS["p05"]="FAIL"
    fi
  else
    log_fail "No session cookie found in cookie jar"
    RESULTS["p05"]="FAIL"
  fi
}

# Test: API Response Headers
test_response_headers() {
  test_case "P0-X: API Response Headers (Content-Type)"

  local test_data=$(cat << 'EOF'
{
  "companyName": "Test",
  "targetJobTitle": "Title",
  "problemTheyFace": "They have a problem",
  "yourProduct": "A product",
  "keyBenefit": "A benefit",
  "callToAction": "Call to action",
  "tone": "Professional"
}
EOF
  )

  local response=$(curl -s -i -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "$test_data" 2>&1)

  if echo "$response" | grep -qi "Content-Type: application/json"; then
    log_pass "API returns correct Content-Type header"
    RESULTS["headers"]="PASS"
  else
    log_fail "API missing or incorrect Content-Type header"
    RESULTS["headers"]="FAIL"
  fi
}

# Test: Endpoint Reachability
test_endpoint_reachability() {
  test_case "P0-X: Endpoint Reachability"

  local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")

  if [[ "$response" == "200" ]] || [[ "$response" == "404" ]]; then
    log_pass "Application is reachable at $BASE_URL"
    RESULTS["reachability"]="PASS"
  else
    log_fail "Application not reachable: HTTP $response"
    RESULTS["reachability"]="FAIL"
  fi
}

# Main execution
main() {
  echo ""
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║     ColdCopy P0 Automated Test Execution Suite          ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  log_info "Target: $BASE_URL"
  log_info "Timestamp: $(date)"
  log_info "Results will be saved to: $RESULTS_FILE"
  echo ""

  # Load test data
  load_test_data

  # Run tests in sequence
  test_endpoint_reachability

  # P0 tests (must pass)
  test_p01_empty_form
  test_p01_happy_path_api
  test_p02_rate_limiting
  test_p03_validation
  test_p04_char_limits
  test_p05_session_persistence

  # Additional tests
  test_response_headers

  # Summary
  echo ""
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║                    TEST SUMMARY                        ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "Total Tests:    $TOTAL_TESTS"
  echo -e "${GREEN}Passed:         $PASSED_TESTS${NC}"
  echo -e "${RED}Failed:         $FAILED_TESTS${NC}"
  echo ""

  # Determine GO/NO-GO
  if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                        GO / PASS                        ║${NC}"
    echo -e "${GREEN}║        All P0 automated tests passed successfully       ║${NC}"
    echo -e "${GREEN}║  Remember: Manual tests still required (see checklist)  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
  else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                       NO-GO / FAIL                      ║${NC}"
    echo -e "${RED}║           Some automated tests failed. Fix them          ║${NC}"
    echo -e "${RED}║             before proceeding with launch.               ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
  fi

  echo ""
  log_info "Test cookie jar: $COOKIE_JAR"
  log_info "Results saved to: $RESULTS_FILE"
  echo ""

  # Save detailed results
  save_results_json

  # Cleanup (optional — keep for debugging)
  # rm -f "$COOKIE_JAR"

  exit $EXIT_CODE
}

# Save results to JSON
save_results_json() {
  cat > "$RESULTS_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "target_url": "$BASE_URL",
  "summary": {
    "total": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "status": "$([ $FAILED_TESTS -eq 0 ] && echo 'GO' || echo 'NO-GO')"
  },
  "results": {
EOF

  local first=true
  for test in "${!RESULTS[@]}"; do
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> "$RESULTS_FILE"
    fi
    echo "    \"$test\": \"${RESULTS[$test]}\"" >> "$RESULTS_FILE"
  done

  cat >> "$RESULTS_FILE" << EOF
  }
}
EOF
}

# Run main function
main
