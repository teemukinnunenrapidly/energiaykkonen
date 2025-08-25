#!/bin/bash

# SSL Verification Script for Energiaykkönen Calculator
# This script tests SSL configuration and security headers for the deployed application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default URL - can be overridden
URL=${1:-"https://laskuri.energiaykkonen.fi"}

if [[ $URL != https://* ]]; then
    print_error "URL must start with https://"
    exit 1
fi

print_status "Testing SSL configuration for: $URL"
echo "=================================================="

# Test 1: Basic SSL Certificate
print_status "1. Testing SSL Certificate..."
if curl -I -s --connect-timeout 10 "$URL" > /dev/null 2>&1; then
    print_success "SSL certificate is valid and accessible"
    
    # Get certificate details
    echo | openssl s_client -servername "$(echo "$URL" | sed 's|https://||' | sed 's|/.*||')" -connect "$(echo "$URL" | sed 's|https://||' | sed 's|/.*||'):443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null
else
    print_error "SSL certificate test failed or site is not accessible"
fi

# Test 2: HTTP to HTTPS Redirect
print_status "2. Testing HTTP to HTTPS redirect..."
HTTP_URL=$(echo "$URL" | sed 's/https:/http:/')
REDIRECT_TEST=$(curl -s -I -L --max-time 10 "$HTTP_URL" 2>/dev/null | grep -i "location.*https" || echo "")

if [[ -n "$REDIRECT_TEST" ]]; then
    print_success "HTTP to HTTPS redirect is working"
else
    print_warning "HTTP to HTTPS redirect test inconclusive (may be handled at CDN level)"
fi

# Test 3: Security Headers
print_status "3. Testing Security Headers..."

# Get headers
HEADERS=$(curl -s -I --max-time 10 "$URL" 2>/dev/null)

# Check Strict-Transport-Security
if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    print_success "✓ Strict-Transport-Security header present"
    echo "$HEADERS" | grep -i "strict-transport-security"
else
    print_warning "✗ Strict-Transport-Security header missing"
fi

# Check X-Frame-Options
if echo "$HEADERS" | grep -qi "x-frame-options"; then
    print_success "✓ X-Frame-Options header present"
    echo "$HEADERS" | grep -i "x-frame-options"
else
    print_warning "✗ X-Frame-Options header missing"
fi

# Check X-Content-Type-Options
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    print_success "✓ X-Content-Type-Options header present"
    echo "$HEADERS" | grep -i "x-content-type-options"
else
    print_warning "✗ X-Content-Type-Options header missing"
fi

# Check Content-Security-Policy
if echo "$HEADERS" | grep -qi "content-security-policy"; then
    print_success "✓ Content-Security-Policy header present"
else
    print_warning "✗ Content-Security-Policy header missing"
fi

# Test 4: TLS Version
print_status "4. Testing TLS Version..."
TLS_VERSION=$(echo | openssl s_client -servername "$(echo "$URL" | sed 's|https://||' | sed 's|/.*||')" -connect "$(echo "$URL" | sed 's|https://||' | sed 's|/.*||'):443" 2>/dev/null | grep -E "Protocol.*TLS" | head -1)

if [[ -n "$TLS_VERSION" ]]; then
    print_success "TLS Version: $TLS_VERSION"
else
    print_warning "Could not determine TLS version"
fi

# Test 5: Certificate Chain
print_status "5. Testing Certificate Chain..."
CERT_CHAIN=$(echo | openssl s_client -servername "$(echo "$URL" | sed 's|https://||' | sed 's|/.*||')" -connect "$(echo "$URL" | sed 's|https://||' | sed 's|/.*||'):443" -showcerts 2>/dev/null | grep -c "BEGIN CERTIFICATE")

if [[ $CERT_CHAIN -gt 1 ]]; then
    print_success "Certificate chain includes $CERT_CHAIN certificates"
else
    print_warning "Certificate chain may be incomplete"
fi

echo "=================================================="
print_status "SSL verification complete for $URL"

# Instructions for manual verification
echo ""
print_status "Manual Verification Steps:"
echo "1. Visit $URL in browser and check for padlock icon"
echo "2. Check certificate details in browser developer tools"
echo "3. Use online SSL testing tools like:"
echo "   - https://www.ssllabs.com/ssltest/"
echo "   - https://www.digicert.com/help/"
echo "4. Verify no mixed content warnings in browser console"
