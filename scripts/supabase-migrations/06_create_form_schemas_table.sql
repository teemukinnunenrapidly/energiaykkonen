-- Create form_schemas table to store form builder configurations
CREATE TABLE IF NOT EXISTS form_schemas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schema_data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for quick lookups
CREATE INDEX IF NOT EXISTS idx_form_schemas_name ON form_schemas(name);

-- Create index on is_active for filtering active schemas
CREATE INDEX IF NOT EXISTS idx_form_schemas_active ON form_schemas(is_active);

-- Create index on created_by for user-specific schemas
CREATE INDEX IF NOT EXISTS idx_form_schemas_created_by ON form_schemas(created_by);

-- Enable Row Level Security
ALTER TABLE form_schemas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own schemas
CREATE POLICY "Users can read their own form schemas" ON form_schemas
  FOR SELECT USING (auth.uid() = created_by);

-- Create policy to allow authenticated users to insert their own schemas
CREATE POLICY "Users can insert their own form schemas" ON form_schemas
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create policy to allow authenticated users to update their own schemas
CREATE POLICY "Users can update their own form schemas" ON form_schemas
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policy to allow authenticated users to delete their own schemas
CREATE POLICY "Users can delete their own form schemas" ON form_schemas
  FOR DELETE USING (auth.uid() = created_by);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_form_schemas_updated_at
  BEFORE UPDATE ON form_schemas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
