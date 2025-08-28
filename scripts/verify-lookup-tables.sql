-- Verification and Creation Script for Formula Lookup Tables
-- Run this in your Supabase SQL editor if lookup tables are missing

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('formula_lookups', 'formula_lookup_conditions');

-- Create formula_lookups table if it doesn't exist
CREATE TABLE IF NOT EXISTS formula_lookups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create formula_lookup_conditions table if it doesn't exist
CREATE TABLE IF NOT EXISTS formula_lookup_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_id UUID NOT NULL REFERENCES formula_lookups(id) ON DELETE CASCADE,
  condition_order INTEGER NOT NULL,
  condition_rule TEXT NOT NULL,
  target_shortcode TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lookup_id, condition_order)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_formula_lookups_active ON formula_lookups(is_active);
CREATE INDEX IF NOT EXISTS idx_formula_lookup_conditions_lookup ON formula_lookup_conditions(lookup_id, condition_order);

-- Enable Row Level Security
ALTER TABLE formula_lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_lookup_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for your security requirements)
DROP POLICY IF EXISTS "Allow all operations on formula_lookups" ON formula_lookups;
CREATE POLICY "Allow all operations on formula_lookups" ON formula_lookups FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on formula_lookup_conditions" ON formula_lookup_conditions;
CREATE POLICY "Allow all operations on formula_lookup_conditions" ON formula_lookup_conditions FOR ALL USING (true);

-- Create trigger for updated_at (assumes update_updated_at_column function exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_formula_lookups_updated_at ON formula_lookups;
CREATE TRIGGER update_formula_lookups_updated_at 
    BEFORE UPDATE ON formula_lookups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('formula_lookups', 'formula_lookup_conditions')
ORDER BY table_name, ordinal_position;