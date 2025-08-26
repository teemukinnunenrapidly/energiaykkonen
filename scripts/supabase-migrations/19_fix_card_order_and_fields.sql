-- Migration: Fix Card Order and Field Names to Match HTML Demo
-- Date: 2024-12-19
-- Description: Updates card templates and fields to match the exact HTML demo structure

-- First, clear existing data to ensure clean setup
DELETE FROM form_stream_cards;
DELETE FROM card_fields;
DELETE FROM card_calculations;
DELETE FROM card_templates;

-- Recreate card templates in the correct order
INSERT INTO card_templates (id, name, display_order, type, title, config) VALUES
  ('00000000-0000-0000-0000-000000000001', 'property_details', 1, 'form', 'Property Details', '{"description": "Tell us about your property"}'),
  ('00000000-0000-0000-0000-000000000002', 'energy_calculation', 2, 'calculation', 'Energy Volume', '{"formula": "floor_area * ceiling_height", "depends_on": ["floor_area", "ceiling_height"]}'),
  ('00000000-0000-0000-0000-000000000003', 'heating_info', 3, 'form', 'Current Heating', '{"description": "Your current heating system"}'),
  ('00000000-0000-0000-0000-000000000004', 'savings_info', 4, 'info', 'Heat Pump Benefits', '{"content": "Save up to 70% on heating costs with modern heat pumps"}'),
  ('00000000-0000-0000-0000-000000000005', 'savings_calc', 5, 'calculation', 'Your Savings', '{"formula": "heating_cost * 0.5", "depends_on": ["heating_cost"]}'),
  ('00000000-0000-0000-0000-000000000006', 'contact', 6, 'form', 'Get Your Quote', '{"description": "Contact information for your personalized quote"}'),
  ('00000000-0000-0000-0000-000000000007', 'submit', 7, 'submit', 'Send Quote', '{"buttonText": "Get My Personal Quote", "description": "We will calculate your savings and send you a personalized quote"}')
ON CONFLICT DO NOTHING;

-- Insert card fields for property_details card (Card 1)
INSERT INTO card_fields (card_id, field_name, field_type, label, placeholder, help_text, width, display_order, required, options, validation_rules) VALUES
  ('00000000-0000-0000-0000-000000000001', 'property_type', 'select', 'Property Type', 'Select property type', 'Choose the type of property you own', 'full', 1, true, 
   '[{"value": "house", "label": "House"}, {"value": "apartment", "label": "Apartment"}, {"value": "townhouse", "label": "Townhouse"}]', 
   '{"required": true}'),
  ('00000000-0000-0000-0000-000000000001', 'floor_area', 'number', 'Floor Area (m²)', 'Enter floor area', 'Total floor area in square meters', 'half', 2, true, 
   NULL, 
   '{"required": true, "min": 10, "max": 1000}'),
  ('00000000-0000-0000-0000-000000000001', 'ceiling_height', 'number', 'Ceiling Height (m)', 'Enter ceiling height', 'Average ceiling height in meters', 'half', 3, true, 
   NULL, 
   '{"required": true, "min": 2, "max": 5}')
ON CONFLICT DO NOTHING;

-- Insert card fields for heating_info card (Card 3)
INSERT INTO card_fields (card_id, field_name, field_type, label, placeholder, help_text, width, display_order, required, options, validation_rules) VALUES
  ('00000000-0000-0000-0000-000000000003', 'heating_type', 'select', 'Heating Type', 'Select heating type', 'Your current heating system', 'full', 1, true, 
   '[{"value": "oil", "label": "Oil Heating"}, {"value": "electric", "label": "Electric Heating"}, {"value": "district", "label": "District Heating"}, {"value": "gas", "label": "Gas Heating"}]', 
   '{"required": true}'),
  ('00000000-0000-0000-0000-000000000003', 'heating_cost', 'number', 'Annual Heating Cost (€)', 'Enter annual cost', 'Your yearly heating expenses in euros', 'full', 2, true, 
   NULL, 
   '{"required": true, "min": 100, "max": 10000}')
ON CONFLICT DO NOTHING;

-- Insert card fields for contact card (Card 6)
INSERT INTO card_fields (card_id, field_name, field_type, label, placeholder, help_text, width, display_order, required, options, validation_rules) VALUES
  ('00000000-0000-0000-0000-000000000006', 'first_name', 'text', 'First Name', 'Enter your first name', 'Your first name', 'half', 1, true, 
   NULL, 
   '{"required": true, "minLength": 2, "maxLength": 50}'),
  ('00000000-0000-0000-0000-000000000006', 'last_name', 'text', 'Last Name', 'Enter your last name', 'Your last name', 'half', 2, true, 
   NULL, 
   '{"required": true, "minLength": 2, "maxLength": 50}'),
  ('00000000-0000-0000-0000-000000000006', 'email', 'email', 'Email', 'Enter your email', 'We will send your quote here', 'full', 3, true, 
   NULL, 
   '{"required": true, "minLength": 5, "maxLength": 100}')
ON CONFLICT DO NOTHING;

-- Insert card calculations for calculation cards
INSERT INTO card_calculations (card_id, formula, display_template, result_format, depends_on) VALUES
  ('00000000-0000-0000-0000-000000000002', 'floor_area * ceiling_height', 'Your property volume: {result} m³', 'number', '["floor_area", "ceiling_height"]'),
  ('00000000-0000-0000-0000-000000000005', 'heating_cost * 0.5', 'Potential annual savings: €{result}', 'currency', '["heating_cost"]')
ON CONFLICT DO NOTHING;

-- Link cards to the form stream in the correct order
INSERT INTO form_stream_cards (stream_id, card_template_id, card_position, is_visible, is_required) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, true, true),  -- Property Details
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 2, true, true),  -- Energy Calculation
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 3, true, true),  -- Heating Info
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 4, true, true),  -- Savings Info
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 5, true, true),  -- Savings Calculation
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 6, true, true),  -- Contact
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 7, true, true)   -- Submit
ON CONFLICT DO NOTHING;

-- Update form visual mappings to match the new field names
DELETE FROM form_visual_mappings WHERE element_type = 'field';
INSERT INTO form_visual_mappings (form_element_id, element_type, visual_object_id) VALUES
  ('property_details', 'section', '00000000-0000-0000-0000-000000000003'),
  ('heating_info', 'section', '00000000-0000-0000-0000-000000000001'),
  ('floor_area', 'field', '00000000-0000-0000-0000-000000000003'),
  ('ceiling_height', 'field', '00000000-0000-0000-0000-000000000003'),
  ('heating_type', 'field', '00000000-0000-0000-0000-000000000001'),
  ('heating_cost', 'field', '00000000-0000-0000-0000-000000000001'),
  ('first_name', 'field', '00000000-0000-0000-0000-000000000002'),
  ('last_name', 'field', '00000000-0000-0000-0000-000000000002'),
  ('email', 'field', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
