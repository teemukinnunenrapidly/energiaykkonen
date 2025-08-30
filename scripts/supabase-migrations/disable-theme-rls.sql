-- Migration: Disable RLS for themes tables to allow admin operations
-- This is the simplest solution for our custom JWT authentication

-- Disable RLS on themes table
ALTER TABLE themes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on card style overrides table  
ALTER TABLE card_style_overrides DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (they're not needed without RLS)
DROP POLICY IF EXISTS "Public can read active themes" ON themes;
DROP POLICY IF EXISTS "Public can read card overrides for active themes" ON card_style_overrides;