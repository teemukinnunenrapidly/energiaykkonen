# Email Integration Setup Guide

This guide helps you set up email delivery using Resend for the Heat Pump Calculator.

## Step 1: Create Resend Account

1. **Visit Resend**
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account
   - Free tier includes 3,000 emails/month, perfect for testing

2. **Verify Your Domain (Optional for Testing)**
   - For production: Add and verify your domain (energiaykkonen.fi)
   - For testing: You can use the default resend.dev domain

## Step 2: Get API Key

1. **Generate API Key**
   - Go to your Resend dashboard
   - Navigate to "API Keys" section
   - Click "Create API Key"
   - Name it "E1-Calculator" or similar
   - Copy the API key (starts with `re_`)

2. **Add to Environment Variables**
   ```bash
   # Add this to your .env.local file
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

## Step 3: Configure Email Addresses

In `src/lib/resend.ts`, update the email configuration:

```typescript
export const emailConfig = {
  from: 'Energiaykkönen Oy <noreply@energiaykkonen.fi>', // Update domain
  salesTo: 'sales@energiaykkonen.fi', // Update with actual sales email
  replyTo: 'info@energiaykkonen.fi', // Update with actual support email
} as const;
```

## Step 4: Test Email Functionality

### Using the Test API

1. **Start development server:**

   ```bash
   npm run dev
   ```

2. **Test with your email:**

   ```bash
   # GET request
   curl "http://localhost:3000/api/test-email?email=your.email@example.com"

   # Or POST request
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your.email@example.com"}'
   ```

3. **Check your inbox and spam folder**

### Using the Calculator Form

1. Fill out the calculator form at `http://localhost:3000`
2. Submit with your email address
3. Check for both emails:
   - Customer results email (to your address)
   - Sales notification (to sales email)

## Step 5: Email Features

### Customer Results Email

- ✅ **Language**: Finnish
- ✅ **Content**: Personalized savings calculations
- ✅ **Design**: Professional, mobile-responsive
- ✅ **CTA**: Call-to-action for free home visit
- ✅ **Branding**: Energiaykkönen colors and styling

### Sales Notification Email

- ✅ **Lead Scoring**: Automatic priority classification
- ✅ **Complete Data**: All form inputs and calculations
- ✅ **Action Buttons**: Direct links to call, email, CRM
- ✅ **Metadata**: IP, user agent, source tracking
- ✅ **Responsive**: Works on all devices

## Step 6: Production Setup

### Domain Verification (Required for Production)

1. **Add Domain in Resend**
   - Go to Domains section in Resend dashboard
   - Add "energiaykkonen.fi"
   - Follow DNS verification steps

2. **Update DNS Records**
   - Add the provided TXT records to your DNS
   - Wait for verification (usually a few minutes)

3. **Update From Addresses**
   - Change `from` addresses to use your verified domain
   - Update `salesTo` with actual sales email address

### Email Deliverability Best Practices

1. **SPF, DKIM, DMARC**
   - Resend automatically handles DKIM signing
   - Ensure your DNS has proper SPF/DMARC records
   - This prevents emails from going to spam

2. **Monitor Delivery**
   - Check Resend dashboard for delivery stats
   - Monitor bounce and complaint rates
   - Add feedback loops for major email providers

## Step 7: Environment Variables Summary

Your `.env.local` should include:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Resend Email Service
RESEND_API_KEY=re_your_resend_api_key

# Admin Security
ADMIN_PASSWORD=your_secure_password
```

## Troubleshooting

### Common Issues

1. **"Missing RESEND_API_KEY" Error**
   - Ensure `.env.local` file exists in project root
   - Restart development server after adding variables
   - Check that the key starts with `re_`

2. **Emails Not Received**
   - Check spam/junk folders first
   - Verify API key is correct
   - Check Resend dashboard for delivery status
   - For testing, use resend.dev domain initially

3. **Domain Not Verified**
   - Production emails require verified domain
   - Follow DNS verification steps in Resend dashboard
   - Allow 24-48 hours for DNS propagation

4. **Rate Limiting**
   - Free tier: 3,000 emails/month
   - Paid plans available for higher volumes
   - Monitor usage in Resend dashboard

### Error Handling

The system is designed to be resilient:

- ✅ Lead submission succeeds even if emails fail
- ✅ Email errors are logged but don't block the API
- ✅ Partial email failures are reported in the response
- ✅ Detailed error logging for debugging

## Success Metrics

Once configured, you should see:

- ✅ Customer emails delivered within seconds
- ✅ Sales notifications with complete lead information
- ✅ Professional, branded email appearance
- ✅ High deliverability rates (>95%)
- ✅ Lead scoring working correctly

## Next Steps

After email integration is working:

1. Test with real email addresses
2. Verify all email content is correct
3. Set up production domain verification
4. Monitor delivery rates and user feedback
5. Consider email analytics integration
