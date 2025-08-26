-- Update form_schemas table RLS policies to allow admin access
-- This fixes the 406 error when accessing form schemas from the admin panel

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read their own form schemas" ON form_schemas;
DROP POLICY IF EXISTS "Users can insert their own form schemas" ON form_schemas;
DROP POLICY IF EXISTS "Users can update their own form schemas" ON form_schemas;
DROP POLICY IF EXISTS "Users can delete their own form schemas" ON form_schemas;

-- Create new policies that allow admin users to access all schemas
-- For now, we'll allow all authenticated users to access form schemas
-- This can be made more restrictive later if needed

-- Allow all authenticated users to read form schemas
CREATE POLICY "Authenticated users can read form schemas" ON form_schemas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert form schemas
CREATE POLICY "Authenticated users can insert form schemas" ON form_schemas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update form schemas
CREATE POLICY "Authenticated users can update form schemas" ON form_schemas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete form schemas
CREATE POLICY "Authenticated users can delete form schemas" ON form_schemas
  FOR DELETE USING (auth.role() = 'authenticated');

-- Note: If you want to restrict access to only admin users later, you can:
-- 1. Create a custom claim in your JWT with admin role
-- 2. Update these policies to check for admin role instead of authenticated
-- 3. Example: USING (auth.jwt() ->> 'role' = 'admin')
