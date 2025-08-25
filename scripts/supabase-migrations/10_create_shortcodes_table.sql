-- Create shortcodes table to store email template shortcodes
CREATE TABLE IF NOT EXISTS shortcodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  example TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('customer', 'results', 'company', 'system')),
  replacement_value TEXT NOT NULL, -- The actual value that will replace the shortcode
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shortcodes_name ON shortcodes(name);
CREATE INDEX IF NOT EXISTS idx_shortcodes_category ON shortcodes(category);
CREATE INDEX IF NOT EXISTS idx_shortcodes_active ON shortcodes(is_active);

-- Enable Row Level Security
ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all shortcodes
CREATE POLICY "Users can read all shortcodes" ON shortcodes
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own shortcodes
CREATE POLICY "Users can insert their own shortcodes" ON shortcodes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create policy to allow authenticated users to update their own shortcodes
CREATE POLICY "Users can update their own shortcodes" ON shortcodes
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policy to allow authenticated users to delete their own shortcodes
CREATE POLICY "Users can delete their own shortcodes" ON shortcodes
  FOR DELETE USING (auth.uid() = created_by);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_shortcodes_updated_at
  BEFORE UPDATE ON shortcodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default shortcodes
INSERT INTO shortcodes (name, description, example, category, replacement_value, created_by) VALUES
  ('customer.name', 'Customer full name', 'John Doe', 'customer', '{{customer.name}}', NULL),
  ('customer.email', 'Customer email address', 'john@example.com', 'customer', '{{customer.email}}', NULL),
  ('customer.phone', 'Customer phone number', '+358 40 123 4567', 'customer', '{{customer.phone}}', NULL),
  ('results.savings', 'Annual energy savings', '€1,200', 'results', '{{results.savings}}', NULL),
  ('results.payback', 'Payback period', '3.5 years', 'results', '{{results.payback}}', NULL),
  ('results.investment', 'Total investment cost', '€4,200', 'results', '{{results.investment}}', NULL),
  ('results.co2', 'CO2 reduction', '2.4 tons/year', 'results', '{{results.co2}}', NULL),
  ('company.name', 'Company name', 'Energia Ykkönen', 'company', '{{company.name}}', NULL),
  ('company.phone', 'Company phone', '+358 9 123 4567', 'company', '{{company.phone}}', NULL),
  ('company.email', 'Company email', 'info@energiaykkonen.fi', 'company', '{{company.email}}', NULL),
  ('system.date', 'Current date', '2024-01-15', 'system', '{{system.date}}', NULL),
  ('system.time', 'Current time', '14:30', 'system', '{{system.time}}', NULL);
