-- Allow admin UUID access to form schemas
-- This ensures the admin user can create, read, update, and delete form schemas

-- First, let's check if we need to create a placeholder admin user in auth.users
-- This is optional but helps with referential integrity
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@system.local',
  '', -- No password needed for system admin
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "system", "providers": ["system"], "role": "admin"}',
  '{"name": "System Administrator"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Update RLS policies to allow admin UUID access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read form schemas" ON form_schemas;
DROP POLICY IF EXISTS "Authenticated users can insert form schemas" ON form_schemas;
DROP POLICY IF EXISTS "Authenticated users can update form schemas" ON form_schemas;
DROP POLICY IF EXISTS "Authenticated users can delete form schemas" ON form_schemas;

-- Create new policies that allow admin UUID and authenticated users
CREATE POLICY "Admin and authenticated users can read form schemas" ON form_schemas
  FOR SELECT USING (
    auth.role() = 'authenticated' OR 
    created_by = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Admin and authenticated users can insert form schemas" ON form_schemas
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR 
    created_by = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Admin and authenticated users can update form schemas" ON form_schemas
  FOR UPDATE USING (
    auth.role() = 'authenticated' OR 
    created_by = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Admin and authenticated users can delete form schemas" ON form_schemas
  FOR DELETE USING (
    auth.role() = 'authenticated' OR 
    created_by = '00000000-0000-0000-0000-000000000001'
  );

-- Alternative: If you prefer to disable RLS temporarily for admin operations
-- Uncomment the line below:
-- ALTER TABLE form_schemas DISABLE ROW LEVEL SECURITY;
