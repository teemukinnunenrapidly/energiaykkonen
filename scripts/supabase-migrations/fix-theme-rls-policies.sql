-- Migration: Fix RLS policies for themes tables
-- This allows admin operations to work with our custom JWT authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can read active themes" ON themes;
DROP POLICY IF EXISTS "Public can read card overrides for active themes" ON card_style_overrides;

-- Create more permissive policies for admin operations
-- Note: This assumes you're using service role key for admin operations

-- Allow all operations for authenticated users (service role)
CREATE POLICY "Service role can manage themes" ON themes
  FOR ALL USING (true);

CREATE POLICY "Service role can manage card overrides" ON card_style_overrides  
  FOR ALL USING (true);

-- Allow public read access to active themes (for the calculator)
CREATE POLICY "Public can read active themes" ON themes
  FOR SELECT USING (is_active = true);

-- Allow public read access to card overrides for active themes
CREATE POLICY "Public can read card overrides for active themes" ON card_style_overrides
  FOR SELECT USING (
    theme_id IN (SELECT id FROM themes WHERE is_active = true)
  );

-- Alternative: Disable RLS for admin operations (if you prefer)
-- You can uncomment these lines instead of using the policies above
-- ALTER TABLE themes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE card_style_overrides DISABLE ROW LEVEL SECURITY;