-- Migration: Add contextual fields to visual_assets table for Visual Support system
-- Date: 2024-12-19
-- Description: Adds fields needed for contextual display of visual assets based on form sections and fields

-- Add description field
ALTER TABLE visual_assets 
ADD COLUMN description TEXT;

-- Add section_id field for linking to form sections
ALTER TABLE visual_assets 
ADD COLUMN section_id UUID REFERENCES form_schemas(id) ON DELETE SET NULL;

-- Add field_id field for linking to specific form fields
ALTER TABLE visual_assets 
ADD COLUMN field_id TEXT;

-- Add field_value field for linking to specific field values/options
ALTER TABLE visual_assets 
ADD COLUMN field_value TEXT;

-- Add priority field for ordering visual assets
ALTER TABLE visual_assets 
ADD COLUMN priority INTEGER DEFAULT 0;

-- Add cloudflare_image_id field for Cloudflare Images integration
ALTER TABLE visual_assets 
ADD COLUMN cloudflare_image_id TEXT;

-- Add title field for display purposes
ALTER TABLE visual_assets 
ADD COLUMN title TEXT;

-- Add help_text field for additional guidance
ALTER TABLE visual_assets 
ADD COLUMN help_text TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN visual_assets.description IS 'Additional descriptive text for the visual asset';
COMMENT ON COLUMN visual_assets.section_id IS 'Reference to form section for contextual display';
COMMENT ON COLUMN visual_assets.field_id IS 'Reference to form field for contextual display';
COMMENT ON COLUMN visual_assets.field_value IS 'Specific field value/option for contextual display';
COMMENT ON COLUMN visual_assets.priority IS 'Priority for ordering visual assets (higher = more important)';
COMMENT ON COLUMN visual_assets.cloudflare_image_id IS 'Cloudflare Images identifier for CDN delivery';
COMMENT ON COLUMN visual_assets.title IS 'Display title for the visual asset';
COMMENT ON COLUMN visual_assets.help_text IS 'Additional help text or guidance for the visual asset';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visual_assets_section_id ON visual_assets(section_id);
CREATE INDEX IF NOT EXISTS idx_visual_assets_field_id ON visual_assets(field_id);
CREATE INDEX IF NOT EXISTS idx_visual_assets_priority ON visual_assets(priority);
CREATE INDEX IF NOT EXISTS idx_visual_assets_context ON visual_assets(section_id, field_id, field_value);

-- Update existing records to have default values
UPDATE visual_assets 
SET 
  title = COALESCE(title, display_name),
  description = COALESCE(description, ''),
  priority = COALESCE(priority, 0)
WHERE title IS NULL OR description IS NULL OR priority IS NULL;
