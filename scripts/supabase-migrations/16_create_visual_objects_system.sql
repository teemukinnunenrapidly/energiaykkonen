-- Migration: Create Visual Objects System
-- Date: 2024-12-19
-- Description: Creates the complete visual objects system with folders, objects, images, and form mappings

-- Visual Objects table
CREATE TABLE IF NOT EXISTS visual_objects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  folder_id UUID REFERENCES visual_folders(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visual Object Images (multiple per object)
CREATE TABLE IF NOT EXISTS visual_object_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visual_object_id UUID REFERENCES visual_objects(id) ON DELETE CASCADE,
  cloudflare_image_id VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folders for organization
CREATE TABLE IF NOT EXISTS visual_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES visual_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form field to visual object mapping
CREATE TABLE IF NOT EXISTS form_visual_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_element_id VARCHAR(255) NOT NULL, -- section/field/option ID
  element_type VARCHAR(50) NOT NULL, -- 'section', 'field', 'option'
  visual_object_id UUID REFERENCES visual_objects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(form_element_id, element_type)
);

-- View tracking
CREATE TABLE IF NOT EXISTS visual_object_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visual_object_id UUID REFERENCES visual_objects(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to document the tables
COMMENT ON TABLE visual_objects IS 'Main visual objects that can contain multiple images';
COMMENT ON TABLE visual_object_images IS 'Individual images within visual objects, linked to Cloudflare';
COMMENT ON TABLE visual_folders IS 'Hierarchical folder organization for visual objects';
COMMENT ON TABLE form_visual_mappings IS 'Maps form elements (sections, fields, options) to visual objects';
COMMENT ON TABLE visual_object_views IS 'Tracks when visual objects are viewed for analytics';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visual_objects_folder_id ON visual_objects(folder_id);
CREATE INDEX IF NOT EXISTS idx_visual_objects_created_at ON visual_objects(created_at);
CREATE INDEX IF NOT EXISTS idx_visual_object_images_object_id ON visual_object_images(visual_object_id);
CREATE INDEX IF NOT EXISTS idx_visual_object_images_display_order ON visual_object_images(display_order);
CREATE INDEX IF NOT EXISTS idx_visual_folders_parent_id ON visual_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_form_visual_mappings_element ON form_visual_mappings(form_element_id, element_type);
CREATE INDEX IF NOT EXISTS idx_form_visual_mappings_object ON form_visual_mappings(visual_object_id);
CREATE INDEX IF NOT EXISTS idx_visual_object_views_object_id ON visual_object_views(visual_object_id);
CREATE INDEX IF NOT EXISTS idx_visual_object_views_viewed_at ON visual_object_views(viewed_at);

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION increment()
RETURNS INTEGER
LANGUAGE SQL
AS $$
  SELECT 1;
$$;

-- Insert some default folders for organization
INSERT INTO visual_folders (id, name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'General', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Forms', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Icons', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Charts', NULL),
  ('00000000-0000-0000-0000-000000000005', 'Backgrounds', NULL)
ON CONFLICT DO NOTHING;

-- Insert some sample visual objects
INSERT INTO visual_objects (id, name, title, description, folder_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'sample-heating', 'Heating System', 'Visual guide for heating system configuration', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000002', 'sample-windows', 'Window Types', 'Different window types and their properties', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003', 'sample-house', 'House Overview', 'Complete house structure visualization', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Insert sample form visual mappings
INSERT INTO form_visual_mappings (form_element_id, element_type, visual_object_id) VALUES
  ('property', 'section', '00000000-0000-0000-0000-000000000003'),
  ('heating', 'section', '00000000-0000-0000-0000-000000000001'),
  ('windows', 'section', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
