# Supabase Setup Guide for E1 Calculator

This guide will help you set up Supabase for the E1 Calculator project.

## Step 1: Create Supabase Project

1. **Visit Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in (GitHub, Google, or email)

2. **Create New Project**
   - Click "New Project" in your dashboard
   - Fill in project details:
     - **Project Name**: `e1-calculator` (or similar)
     - **Database Password**: Create a strong password (save this!)
     - **Region**: Choose closest to your users (e.g., Europe West for EU users)
   - Click "Create New Project"
   - Wait for provisioning (usually 1-2 minutes)

## Step 2: Get Your Credentials

1. **Navigate to API Settings**
   - Go to your project dashboard
   - Click the gear icon (Settings) in the left sidebar
   - Click "API" in the settings menu

2. **Copy the Following**
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

## Step 3: Set Up Environment Variables

1. **Create `.env.local` file**

   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your Supabase credentials**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 4: Test Connection

Run the development server and check for any Supabase connection errors:

```bash
npm run dev
```

Check the browser console and terminal for any errors related to Supabase environment variables.

## Step 5: Create the Leads Table (Next Task)

After setting up the connection, the next step will be to create the leads table schema in Supabase. This is covered in task 7.2.

## Security Notes

- ✅ `NEXT_PUBLIC_*` variables are safe to expose to the browser
- ✅ The `anon` key has limited permissions by default
- ⚠️ Never commit your `.env.local` file to version control
- ✅ Use different credentials for development and production

## Troubleshooting

**Common Issues:**

1. **Missing environment variables error**
   - Ensure `.env.local` exists and has the correct variable names
   - Restart your development server after adding variables

2. **Connection timeout**
   - Check if your project region is optimal
   - Verify your internet connection

3. **Invalid credentials**
   - Double-check you copied the URL and key correctly
   - Ensure no extra spaces or characters

## Next Steps

Once Supabase is connected:

1. ✅ Task 7.1: Set up Supabase project (this task)
2. ⏭️ Task 7.2: Create leads table schema
3. ⏭️ Task 7.3: Configure RLS and SSL
4. ⏭️ Task 7.4: Test API integration
