# Cloudflare Images Setup Guide

## Overview
The Visual Assets Manager supports image uploads via Cloudflare Images. Without these credentials configured, visual objects can still be created but images cannot be uploaded.

## Required Environment Variables

Add these to your `.env.local` file locally and to Vercel environment variables for production:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_IMAGES_API_TOKEN=your_api_token_here
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH=your_account_hash_here
```

## Setup Instructions

### 1. Get Cloudflare Account ID
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. On the right sidebar, find your **Account ID**
4. Copy this value for `CLOUDFLARE_ACCOUNT_ID`

### 2. Create API Token
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom token** template
4. Configure permissions:
   - **Account** > **Cloudflare Images** > **Edit**
5. Click **Continue to summary**
6. Click **Create Token**
7. Copy this token for `CLOUDFLARE_IMAGES_API_TOKEN`

### 3. Get Account Hash
1. Go to [Cloudflare Images Dashboard](https://dash.cloudflare.com/?to=/:account/images)
2. Click **Direct Upload**
3. Find the URL format: `https://api.cloudflare.com/client/v4/accounts/{account_hash}/images/v1`
4. Copy the account hash for `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH`

## Adding to Vercel

### Via Vercel Dashboard
1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: Your account ID
   - Environment: Production, Preview, Development
4. Repeat for all three variables
5. Redeploy your application

### Via Vercel CLI
```bash
vercel env add CLOUDFLARE_ACCOUNT_ID
vercel env add CLOUDFLARE_IMAGES_API_TOKEN
vercel env add NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH
```

## Testing the Setup

1. After adding environment variables, redeploy your application
2. Go to `/admin/visual-assets`
3. Try creating a visual object with an image
4. If successful, the image should upload without errors

## Fallback Behavior

If Cloudflare Images is not configured:
- Visual objects can still be created
- Images cannot be uploaded
- You'll see a warning message but the object will be saved
- Images can be added later once Cloudflare is configured

## Troubleshooting

### "Cloudflare Images not configured" Error
- Verify all three environment variables are set
- Check that the API token has the correct permissions
- Ensure the account ID and hash match your Cloudflare account

### "Upload failed" Error
- Check API token permissions (needs Cloudflare Images Edit access)
- Verify the account is on a plan that includes Cloudflare Images
- Check if you've reached your storage limit

### Images Not Displaying
- Ensure `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH` is set correctly
- This variable must start with `NEXT_PUBLIC_` to be available client-side
- Check browser console for 404 errors on image URLs

## Optional: Local Development Without Cloudflare

For local development without Cloudflare setup:
1. Visual objects can be created without images
2. Use placeholder images for testing
3. The system will gracefully handle missing Cloudflare configuration

## Security Notes

- Never commit API tokens to git
- Use environment variables only
- Rotate API tokens regularly
- Limit token permissions to only what's needed (Cloudflare Images Edit)