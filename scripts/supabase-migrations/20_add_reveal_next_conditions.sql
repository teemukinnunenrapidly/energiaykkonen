-- Migration: Add Reveal Next Conditions to Card Templates
-- Date: 2024-12-19
-- Description: Replace reveal_conditions with reveal_next_conditions for better flow control

-- Add the new column with a default value
ALTER TABLE card_templates 
ADD COLUMN reveal_next_conditions JSONB DEFAULT '{"type": "immediately"}';

-- Update existing cards with appropriate defaults based on card type
UPDATE card_templates 
SET reveal_next_conditions = 
  CASE 
    WHEN type IN ('info', 'visual', 'calculation') THEN '{"type": "immediately"}'::jsonb
    WHEN type = 'form' THEN '{"type": "required_complete"}'::jsonb
    WHEN type = 'submit' THEN NULL -- Last card doesn't need reveal conditions
    ELSE '{"type": "immediately"}'::jsonb
  END;

-- Optional: Drop the old reveal_conditions column after migration is verified
-- ALTER TABLE card_templates DROP COLUMN reveal_conditions;

-- Add a comment explaining the field
COMMENT ON COLUMN card_templates.reveal_next_conditions IS 'Controls when the next card in the sequence should be revealed. Options: immediately, required_complete, all_complete';
