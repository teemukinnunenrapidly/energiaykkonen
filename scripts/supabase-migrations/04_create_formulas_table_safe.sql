-- Safe migration for formulas table - handles existing objects gracefully

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS formulas_updated_at ON formulas;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_formulas_updated_at();

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_formulas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table if it doesn't exist
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_formulas_name ON formulas(name);
CREATE INDEX IF NOT EXISTS idx_formulas_type ON formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_formulas_active ON formulas(is_active);

-- Create the trigger
CREATE TRIGGER formulas_updated_at
  BEFORE UPDATE ON formulas
  FOR EACH ROW
  EXECUTE FUNCTION update_formulas_updated_at();

-- Add any missing columns if table already existed
DO $$
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formulas' AND column_name = 'created_by') THEN
        ALTER TABLE formulas ADD COLUMN created_by UUID;
    END IF;
    
    -- Add version column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formulas' AND column_name = 'version') THEN
        ALTER TABLE formulas ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formulas' AND column_name = 'tags') THEN
        ALTER TABLE formulas ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;
