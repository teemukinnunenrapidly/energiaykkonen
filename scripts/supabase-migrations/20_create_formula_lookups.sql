-- Formula Lookup Tables
-- Allows admins to create conditional lookup tables in the Calculations page

-- Main lookup table definition
CREATE TABLE IF NOT EXISTS formula_lookups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual lookup conditions (rules)
CREATE TABLE IF NOT EXISTS formula_lookup_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_id UUID NOT NULL REFERENCES formula_lookups(id) ON DELETE CASCADE,
  condition_order INTEGER NOT NULL,
  condition_rule TEXT NOT NULL, -- e.g., "[field:heating_type] == 'oil'"
  target_shortcode TEXT NOT NULL, -- e.g., "[calc:oil-heating-formula]"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lookup_id, condition_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_formula_lookups_active ON formula_lookups(is_active);
CREATE INDEX IF NOT EXISTS idx_formula_lookup_conditions_lookup ON formula_lookup_conditions(lookup_id, condition_order);

-- Row Level Security
ALTER TABLE formula_lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_lookup_conditions ENABLE ROW LEVEL SECURITY;

-- Policies (allow all operations - admin only access via middleware)
CREATE POLICY "Allow all operations on formula_lookups" ON formula_lookups FOR ALL USING (true);
CREATE POLICY "Allow all operations on formula_lookup_conditions" ON formula_lookup_conditions FOR ALL USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_formula_lookups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_formula_lookups_updated_at
  BEFORE UPDATE ON formula_lookups
  FOR EACH ROW
  EXECUTE FUNCTION update_formula_lookups_updated_at();