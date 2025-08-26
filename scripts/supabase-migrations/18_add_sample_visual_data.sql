-- Migration: Add Sample Visual Data for Testing
-- Date: 2024-12-19
-- Description: Adds sample visual objects and images for testing the frontend

-- Add sample images for the visual objects
INSERT INTO visual_object_images (visual_object_id, cloudflare_image_id, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'sample-heating-1', 1),
  ('00000000-0000-0000-0000-000000000001', 'sample-heating-2', 2),
  ('00000000-0000-0000-0000-000000000002', 'sample-windows-1', 1),
  ('00000000-0000-0000-0000-000000000002', 'sample-windows-2', 2),
  ('00000000-0000-0000-0000-000000000003', 'sample-house-1', 1),
  ('00000000-0000-0000-0000-000000000003', 'sample-house-2', 2),
  ('00000000-0000-0000-0000-000000000003', 'sample-house-3', 3)
ON CONFLICT DO NOTHING;

-- Add more specific form visual mappings for testing
INSERT INTO form_visual_mappings (form_element_id, element_type, visual_object_id) VALUES
  ('property_details', 'section', '00000000-0000-0000-0000-000000000003'),
  ('heating_info', 'section', '00000000-0000-0000-0000-000000000001'),
  ('floor_area', 'field', '00000000-0000-0000-0000-000000000003'),
  ('ceiling_height', 'field', '00000000-0000-0000-0000-000000000003'),
  ('heating_type', 'field', '00000000-0000-0000-0000-000000000001'),
  ('heating_cost', 'field', '00000000-0000-0000-0000-000000000001'),
  ('name', 'field', '00000000-0000-0000-0000-000000000002'),
  ('email', 'field', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Add some sample card fields with options for select fields
UPDATE card_fields 
SET options = '[{"value": "house", "label": "House"}, {"value": "apartment", "label": "Apartment"}, {"value": "townhouse", "label": "Townhouse"}]'
WHERE field_name = 'property_type';

UPDATE card_fields 
SET options = '[{"value": "oil", "label": "Oil Heating"}, {"value": "electric", "label": "Electric Heating"}, {"value": "district", "label": "District Heating"}, {"value": "gas", "label": "Gas Heating"}]'
WHERE field_name = 'heating_type';

-- Add validation rules to some fields
UPDATE card_fields 
SET validation_rules = '{"min": 10, "max": 1000}'
WHERE field_name = 'floor_area';

UPDATE card_fields 
SET validation_rules = '{"min": 2, "max": 5}'
WHERE field_name = 'ceiling_height';

UPDATE card_fields 
SET validation_rules = '{"min": 100, "max": 10000}'
WHERE field_name = 'heating_cost';

UPDATE card_fields 
SET validation_rules = '{"minLength": 2, "maxLength": 50}'
WHERE field_name = 'name';

UPDATE card_fields 
SET validation_rules = '{"minLength": 5, "maxLength": 100}'
WHERE field_name = 'email';
