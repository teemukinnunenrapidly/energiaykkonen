# Environment Variables Setup Guide

## Required Environment Variables

Based on your PRD, you need to set up the following environment variables:

### 1. Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get these:**

- Go to [Supabase](https://supabase.com)
- Create a new project or use existing one
- Go to Project Settings > API
- Copy the Project URL and anon/public key

### 2. Email Service (Resend)

```bash
RESEND_API_KEY=your_resend_api_key_here
```

**How to get this:**

- Go to [Resend](https://resend.com)
- Sign up and create an API key
- Copy the API key from your dashboard

### 3. Admin Panel Security

```bash
ADMIN_PASSWORD=your_secure_admin_password_here
```

**Set this to:**

- A strong, secure password
- At least 12 characters
- Mix of letters, numbers, and symbols

## Setup Instructions

### Option 1: Local Development (.env.local)

1. Create a `.env.local` file in your project root
2. Copy the variables above and fill in your actual values
3. **Never commit this file to Git**

### Option 2: Vercel Production

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with its value
5. Deploy to apply changes

### Option 3: Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add RESEND_API_KEY
vercel env add ADMIN_PASSWORD
```

## Security Notes

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `RESEND_API_KEY` and `ADMIN_PASSWORD` are server-side only
- Never commit actual API keys to version control
- Use different keys for development and production

## Next Steps

After setting up these variables:

1. Test locally with `.env.local`
2. Deploy to Vercel with production values
3. Verify all integrations work correctly
