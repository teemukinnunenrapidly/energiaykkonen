#!/bin/bash

# Test script for iframe integration testing
# Tests WordPress-style embed functionality

echo "🧪 Testing Iframe Integration for WordPress Embed"
echo "=================================================="

BASE_URL="http://localhost:3000"
TEST_RESULTS_FILE="iframe-test-results.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize results file
echo "Iframe Integration Test Results - $(date)" > $TEST_RESULTS_FILE
echo "=========================================" >> $TEST_RESULTS_FILE

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    echo -e "[$status] $test_name: $details"
    echo "[$status] $test_name: $details" >> $TEST_RESULTS_FILE
}

# Test 1: Check if embed.js is accessible
echo -e "${BLUE}Test 1: Embed Script Accessibility${NC}"
if curl -s -f "$BASE_URL/embed.js" > /dev/null; then
    log_test "Embed Script" "✅ PASS" "embed.js is accessible"
else
    log_test "Embed Script" "❌ FAIL" "embed.js is not accessible"
fi

# Test 2: Check iframe embedding security headers
echo -e "${BLUE}Test 2: Iframe Embedding Headers${NC}"
HEADERS=$(curl -s -I "$BASE_URL/")

if echo "$HEADERS" | grep -q "frame-ancestors \*"; then
    log_test "Frame Ancestors" "✅ PASS" "frame-ancestors allows embedding"
else
    log_test "Frame Ancestors" "❌ FAIL" "frame-ancestors may block embedding"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    log_test "X-Frame-Options" "⚠️ WARNING" "X-Frame-Options header present (may block embedding)"
else
    log_test "X-Frame-Options" "✅ PASS" "No restrictive X-Frame-Options header"
fi

# Test 3: Check WordPress demo page
echo -e "${BLUE}Test 3: WordPress Demo Page${NC}"
if curl -s -f "$BASE_URL/wordpress-demo.html" > /dev/null; then
    log_test "WordPress Demo" "✅ PASS" "WordPress demo page is accessible"
    
    # Check if iframe is properly embedded
    DEMO_CONTENT=$(curl -s "$BASE_URL/wordpress-demo.html")
    if echo "$DEMO_CONTENT" | grep -q "energiaykkonen-calculator"; then
        log_test "Iframe Embed" "✅ PASS" "Calculator iframe found in demo page"
    else
        log_test "Iframe Embed" "❌ FAIL" "Calculator iframe not found in demo page"
    fi
else
    log_test "WordPress Demo" "❌ FAIL" "WordPress demo page is not accessible"
fi

# Test 4: Test calculator page accessibility
echo -e "${BLUE}Test 4: Calculator Page Accessibility${NC}"
if curl -s -f "$BASE_URL/calculator" > /dev/null; then
    log_test "Calculator Page" "✅ PASS" "Calculator page is accessible"
else
    log_test "Calculator Page" "❌ FAIL" "Calculator page is not accessible"
fi

# Test 5: Test embed test page
echo -e "${BLUE}Test 5: Embed Test Page${NC}"
if curl -s -f "$BASE_URL/embed-test.html" > /dev/null; then
    log_test "Embed Test Page" "✅ PASS" "Embed test page is accessible"
else
    log_test "Embed Test Page" "❌ FAIL" "Embed test page is not accessible"
fi

# Test 6: Check for JavaScript functionality in embed script
echo -e "${BLUE}Test 6: Embed Script Content Analysis${NC}"
EMBED_SCRIPT=$(curl -s "$BASE_URL/embed.js")

if echo "$EMBED_SCRIPT" | grep -q "postMessage"; then
    log_test "PostMessage API" "✅ PASS" "postMessage functionality found"
else
    log_test "PostMessage API" "❌ FAIL" "postMessage functionality not found"
fi

if echo "$EMBED_SCRIPT" | grep -q "MutationObserver"; then
    log_test "MutationObserver" "✅ PASS" "DOM change detection found"
else
    log_test "MutationObserver" "❌ FAIL" "DOM change detection not found"
fi

if echo "$EMBED_SCRIPT" | grep -q "calculator-resize"; then
    log_test "Message Type" "✅ PASS" "Correct message type identifier found"
else
    log_test "Message Type" "❌ FAIL" "Message type identifier not found"
fi

# Test 7: Performance and optimization checks
echo -e "${BLUE}Test 7: Performance Analysis${NC}"
EMBED_SIZE=$(curl -s "$BASE_URL/embed.js" | wc -c)
log_test "Script Size" "ℹ️ INFO" "Embed script is $EMBED_SIZE bytes"

if [ "$EMBED_SIZE" -lt 10000 ]; then
    log_test "Size Optimization" "✅ PASS" "Script size is reasonable (<10KB)"
else
    log_test "Size Optimization" "⚠️ WARNING" "Script size is large (>10KB)"
fi

# Test 8: WordPress compatibility checks
echo -e "${BLUE}Test 8: WordPress Compatibility${NC}"
DEMO_CONTENT=$(curl -s "$BASE_URL/wordpress-demo.html")

if echo "$DEMO_CONTENT" | grep -q "wp-embed-container"; then
    log_test "WP CSS Classes" "✅ PASS" "WordPress-style CSS classes found"
else
    log_test "WP CSS Classes" "❌ FAIL" "WordPress-style CSS classes not found"
fi

if echo "$DEMO_CONTENT" | grep -q "addEventListener.*message"; then
    log_test "Message Listener" "✅ PASS" "Message listener found in demo"
else
    log_test "Message Listener" "❌ FAIL" "Message listener not found in demo"
fi

# Summary
echo ""
echo -e "${YELLOW}Test Summary${NC}"
echo "============"
TOTAL_TESTS=$(grep -c "\[" $TEST_RESULTS_FILE)
PASSED_TESTS=$(grep -c "✅ PASS" $TEST_RESULTS_FILE)
FAILED_TESTS=$(grep -c "❌ FAIL" $TEST_RESULTS_FILE)
WARNING_TESTS=$(grep -c "⚠️ WARNING" $TEST_RESULTS_FILE)

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Warnings: ${YELLOW}$WARNING_TESTS${NC}"

# Overall status
if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All critical tests passed! WordPress embed is ready.${NC}"
    OVERALL_STATUS="✅ READY FOR PRODUCTION"
else
    echo -e "\n${RED}❌ Some tests failed. Review results before deployment.${NC}"
    OVERALL_STATUS="❌ NEEDS ATTENTION"
fi

echo "" >> $TEST_RESULTS_FILE
echo "OVERALL STATUS: $OVERALL_STATUS" >> $TEST_RESULTS_FILE

# Generate usage instructions
echo ""
echo -e "${BLUE}WordPress Integration Instructions:${NC}"
echo "1. Add this iframe to your WordPress post/page:"
echo "   <iframe id=\"energiaykkonen-calculator\" src=\"$BASE_URL/calculator\" style=\"width:100%; border:none;\" scrolling=\"no\"></iframe>"
echo ""
echo "2. Add this script after the iframe:"
echo "   <script src=\"$BASE_URL/embed.js\" async></script>"
echo ""
echo "3. Test the integration at: $BASE_URL/wordpress-demo.html"
echo ""
echo "Results saved to: $TEST_RESULTS_FILE"
