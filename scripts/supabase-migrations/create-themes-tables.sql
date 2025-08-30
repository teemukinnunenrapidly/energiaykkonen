-- Migration: Create themes and card style overrides tables
-- This enables the appearance customization system

-- Create themes table for global theme storage
CREATE TABLE IF NOT EXISTS themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  theme_data JSONB NOT NULL, -- Stores the complete GlobalTheme object
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card style overrides table for card-specific customizations
CREATE TABLE IF NOT EXISTS card_style_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL, -- References card_templates.id
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  style_overrides JSONB NOT NULL, -- Stores CardStyleOverride object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one override per card per theme
  UNIQUE(card_id, theme_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active);
CREATE INDEX IF NOT EXISTS idx_themes_default ON themes(is_default);
CREATE INDEX IF NOT EXISTS idx_card_overrides_card_id ON card_style_overrides(card_id);
CREATE INDEX IF NOT EXISTS idx_card_overrides_theme_id ON card_style_overrides(theme_id);

-- Create trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to both tables
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_overrides_updated_at BEFORE UPDATE ON card_style_overrides 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default theme
INSERT INTO themes (name, description, theme_data, is_active, is_default) VALUES (
  'Default Theme',
  'Clean and professional default theme',
  '{
    "primaryColor": "#3b82f6",
    "secondaryColor": "#22c55e",
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingFontFamily": "Inter, system-ui, sans-serif",
    "fieldSettings": {
      "borderRadius": "md",
      "fieldStyle": "outlined",
      "buttonStyle": "solid",
      "buttonRadius": "md",
      "fieldSpacing": "default"
    },
    "computed": {
      "primaryHover": "#2563eb",
      "primaryLight": "#60a5fa",
      "primaryText": "#ffffff",
      "secondaryHover": "#16a34a",
      "secondaryLight": "#4ade80",
      "secondaryText": "#ffffff"
    }
  }'::jsonb,
  true,
  true
) ON CONFLICT DO NOTHING;

-- Add RLS (Row Level Security) policies if needed
-- Note: Adjust these policies based on your authentication setup

-- Enable RLS on both tables
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_style_overrides ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active themes (for the calculator)
CREATE POLICY "Public can read active themes" ON themes
  FOR SELECT USING (is_active = true);

-- Allow public read access to card overrides for active themes
CREATE POLICY "Public can read card overrides for active themes" ON card_style_overrides
  FOR SELECT USING (
    theme_id IN (SELECT id FROM themes WHERE is_active = true)
  );

-- Admin access policies (you may need to adjust based on your admin auth setup)
-- These are examples - modify according to your authentication system

-- CREATE POLICY "Admins can manage themes" ON themes
--   FOR ALL USING (auth.role() = 'admin');

-- CREATE POLICY "Admins can manage card overrides" ON card_style_overrides
--   FOR ALL USING (auth.role() = 'admin');

-- Comments for documentation
COMMENT ON TABLE themes IS 'Stores global theme configurations for the appearance system';
COMMENT ON TABLE card_style_overrides IS 'Stores card-specific style overrides that extend global themes';
COMMENT ON COLUMN themes.theme_data IS 'Complete GlobalTheme object including colors, typography, and settings';
COMMENT ON COLUMN card_style_overrides.style_overrides IS 'CardStyleOverride object with card-specific customizations';