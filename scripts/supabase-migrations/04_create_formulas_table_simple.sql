-- Create formulas table for storing calculation formulas (Simplified Version)
CREATE TABLE IF NOT EXISTS formulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  formula_text TEXT NOT NULL,
  formula_type VARCHAR(100) DEFAULT 'energy_calculation',
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_formulas_name ON formulas(name);
CREATE INDEX IF NOT EXISTS idx_formulas_type ON formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_formulas_active ON formulas(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_formulas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER formulas_updated_at
  BEFORE UPDATE ON formulas
  FOR EACH ROW
  EXECUTE FUNCTION update_formulas_updated_at();
