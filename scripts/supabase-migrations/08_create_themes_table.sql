-- Create simple appearance_settings table for basic customization
CREATE TABLE IF NOT EXISTS appearance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic branding
  company_name VARCHAR(255) DEFAULT 'Energia Ykkönen',
  company_logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#64748b',
  
  -- Calculator appearance
  calculator_title VARCHAR(255) DEFAULT 'Energian laskuri',
  calculator_subtitle TEXT DEFAULT 'Laske energiansäästösi lämpöpumpulla',
  
  -- Form styling
  form_background_color VARCHAR(7) DEFAULT '#ffffff',
  form_border_radius VARCHAR(20) DEFAULT 'rounded-lg',
  button_style VARCHAR(50) DEFAULT 'default', -- 'default', 'rounded', 'minimal'
  
  -- Active settings
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appearance_settings_active ON appearance_settings(is_active);

-- Enable Row Level Security
ALTER TABLE appearance_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all settings
CREATE POLICY "Users can read all appearance settings" ON appearance_settings
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own settings
CREATE POLICY "Users can insert their own appearance settings" ON appearance_settings
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create policy to allow authenticated users to update their own settings
CREATE POLICY "Users can update their own appearance settings" ON appearance_settings
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policy to allow authenticated users to delete their own settings
CREATE POLICY "Users can delete their own appearance settings" ON appearance_settings
  FOR DELETE USING (auth.uid() = created_by);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_appearance_settings_updated_at
  BEFORE UPDATE ON appearance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one active setting exists
CREATE OR REPLACE FUNCTION ensure_single_active_appearance()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this as active, unset all others
  IF NEW.is_active = true THEN
    UPDATE appearance_settings SET is_active = false WHERE id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single active appearance setting
CREATE TRIGGER ensure_single_active_appearance_trigger
  BEFORE INSERT OR UPDATE ON appearance_settings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_appearance();
