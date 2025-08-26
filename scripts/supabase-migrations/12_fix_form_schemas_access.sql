-- Temporarily disable RLS on form_schemas table to fix 406 error
-- This allows the Form Builder to work while we implement proper authentication

-- Disable RLS temporarily
ALTER TABLE form_schemas DISABLE ROW LEVEL SECURITY;

-- Note: This is a temporary fix. Once proper authentication is implemented,
-- RLS should be re-enabled with appropriate policies for admin users.

-- Alternative approach (if you prefer to keep RLS enabled):
-- 1. Create a service role key in Supabase dashboard
-- 2. Use the service role key for admin operations
-- 3. Keep RLS enabled for regular user operations
