-- Add 'buttons' field type to the card_fields_field_type_check constraint
-- This allows the new buttons field type to be saved to the database

-- First, drop the existing constraint
ALTER TABLE card_fields DROP CONSTRAINT IF EXISTS card_fields_field_type_check;

-- Add the constraint back with 'buttons' included
ALTER TABLE card_fields ADD CONSTRAINT card_fields_field_type_check 
CHECK (field_type IN ('text', 'number', 'email', 'select', 'radio', 'buttons', 'checkbox', 'textarea'));

-- Add a comment to document the new field type
COMMENT ON CONSTRAINT card_fields_field_type_check ON card_fields IS 'Allowed field types: text, number, email, select, radio, buttons, checkbox, textarea';