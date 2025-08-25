-- Disable RLS on formulas table to fix permission issues

-- Disable Row Level Security
ALTER TABLE formulas DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admin users can manage formulas" ON formulas;
DROP POLICY IF EXISTS "Authenticated users can manage formulas" ON formulas;
DROP POLICY IF EXISTS "Admin users can manage formulas" ON formulas;
