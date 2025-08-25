# Email Testing & Validation Guide

Complete guide for testing the email delivery system in the Heat Pump Calculator.

## Quick Start

### 1. Configuration Check

```bash
# Check if email system is properly configured
curl http://localhost:3000/api/email-status
```

### 2. Quick Test

```bash
# Send test emails to your address
curl "http://localhost:3000/api/test-email?email=your@email.com"
```

### 3. Full Test Suite

```bash
# Run comprehensive tests via npm script
npm run test:email -- --email your@email.com
```

## Testing Methods

### Method 1: Web Dashboard (Recommended)

Visit: `http://localhost:3000/test-emails`

**Features:**

- ✅ Configuration status check
- ✅ Quick smoke test (2 emails)
- ✅ Full test suite (8+ emails)
- ✅ Real-time results
- ✅ User-friendly interface

### Method 2: API Endpoints

#### Configuration Status

```bash
GET /api/email-status
```

#### Quick Email Test

```bash
GET /api/test-email?email=your@email.com
POST /api/test-email
{"email": "your@email.com"}
```

#### Comprehensive Test Suite

```bash
GET /api/test-email-suite?mode=smoke&email=your@email.com
POST /api/test-email-suite
{"email": "your@email.com", "mode": "full"}
```

### Method 3: npm Scripts

#### Smoke Test

```bash
npm run test:email
npm run test:email -- --email your@email.com
```

#### Full Test Suite

```bash
npm run test:email:full
npm run test:email:full -- --email your@email.com --verbose
```

### Method 4: Node.js Script

```bash
# Basic test
node scripts/validate-email-system.js

# With custom email
node scripts/validate-email-system.js --email your@email.com

# Full test suite with verbose output
node scripts/validate-email-system.js --mode full --verbose
```

## Test Types

### Smoke Test (Quick)

**Duration:** ~5 seconds  
**Emails Sent:** 2 emails

- 1 customer results email
- 1 sales notification email

**Use Cases:**

- Quick validation during development
- CI/CD pipeline checks
- Basic functionality verification

### Full Test Suite (Comprehensive)

**Duration:** ~30 seconds  
**Emails Sent:** 8+ emails

- Customer emails (4 scenarios: high-value, medium-value, low-value, minimal-data)
- Sales emails (3 scenarios with lead scoring)
- Combined email flows
- Error handling tests

**Use Cases:**

- Pre-deployment validation
- Complete system verification
- Lead scoring algorithm testing

## Email Scenarios Tested

### Customer Result Emails

1. **High-Value Lead**
   - Large house (180m²), oil heating
   - High savings potential (€2,463/year)
   - Complete contact information

2. **Medium-Value Lead**
   - Medium house (120m²), electric heating
   - Moderate savings (€1,526/year)
   - Standard scenario

3. **Low-Value Lead**
   - Small house (80m²), district heating
   - Lower savings (€950/year)
   - Minimal contact info

4. **Minimal Data Lead**
   - Required fields only
   - Basic calculation results
   - Edge case testing

### Sales Notification Emails

1. **High Priority Lead**
   - Lead score: HIGH
   - Premium savings potential
   - Urgent follow-up required

2. **Medium Priority Lead**
   - Lead score: MEDIUM
   - Standard follow-up
   - Good conversion potential

3. **Low Priority Lead**
   - Lead score: LOW
   - Lower priority follow-up
   - Basic qualification

## What to Check

### In Your Inbox

1. **Customer Results Email**
   - ✅ Professional design and branding
   - ✅ Correct savings calculations
   - ✅ Personalized greeting
   - ✅ Clear call-to-action
   - ✅ Contact information
   - ✅ Mobile responsiveness

2. **Sales Notification Email**
   - ✅ All lead information displayed
   - ✅ Correct lead scoring
   - ✅ Action buttons working
   - ✅ Calculation results accurate
   - ✅ Metadata included

### In Spam/Junk Folder

- Check if emails are being filtered
- Note delivery rates
- Verify sender reputation

### Test Results

- ✅ All tests passing
- ✅ No error messages
- ✅ Reasonable response times
- ✅ Proper error handling

## Common Issues & Solutions

### 1. Configuration Errors

**Issue:** `Missing RESEND_API_KEY environment variable`

```bash
# Solution: Add to .env.local
echo "RESEND_API_KEY=re_your_api_key_here" >> .env.local
```

**Issue:** `Invalid API key`

```bash
# Solution: Check your Resend dashboard for correct key
# Ensure key starts with 're_'
```

### 2. Email Delivery Issues

**Issue:** Emails not received

```bash
# Check spam folder first
# Verify email address is correct
# Check Resend dashboard for delivery status
```

**Issue:** Emails in spam folder

```bash
# For production: verify domain in Resend
# Set up SPF, DKIM, DMARC records
# Use verified sending domain
```

### 3. Test Failures

**Issue:** Lead scoring incorrect

```bash
# Check test scenarios match expected scores
# Verify calculation logic in email-templates/utils.ts
```

**Issue:** Template rendering errors

```bash
# Check for missing data fields
# Verify template syntax
# Check console logs for details
```

## Production Checklist

Before deploying to production:

### Email Configuration

- [ ] Domain verified in Resend
- [ ] Production API key configured
- [ ] DNS records set up (SPF, DKIM, DMARC)
- [ ] Email addresses updated in config

### Testing

- [ ] Smoke test passes
- [ ] Full test suite passes
- [ ] Production email addresses tested
- [ ] Spam folder checks completed

### Monitoring

- [ ] Resend dashboard access configured
- [ ] Delivery rate monitoring set up
- [ ] Error logging in place
- [ ] Bounce/complaint handling configured

## Monitoring & Analytics

### Resend Dashboard

- Monitor delivery rates
- Track bounces and complaints
- View email logs and errors
- Manage domain verification

### Application Logs

```bash
# Check server logs for email errors
tail -f logs/email.log

# Monitor API responses
curl http://localhost:3000/api/email-status
```

### Key Metrics

- Delivery rate: >95%
- Bounce rate: <2%
- Complaint rate: <0.1%
- Response time: <5 seconds

## Support & Troubleshooting

### Documentation

- [Resend Documentation](https://resend.com/docs)
- [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

### Debug Mode

Enable verbose logging:

```bash
node scripts/validate-email-system.js --verbose
```

### Manual Testing

Test individual components:

```javascript
// In browser console or Node.js
const response = await fetch('/api/test-email-suite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your@email.com', mode: 'smoke' }),
});
console.log(await response.json());
```

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Test Email System
  run: |
    npm run dev &
    sleep 10
    npm run test:email
    kill %1
```

### Exit Codes

- `0`: All tests passed
- `1`: Tests failed or configuration error

This ensures email functionality is validated before deployment.
