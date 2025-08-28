-- Migration: Add new reveal system columns
-- This separates card completion logic from reveal timing logic

-- Add completion_rules column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'card_templates' AND column_name = 'completion_rules') THEN
    ALTER TABLE card_templates ADD COLUMN completion_rules JSONB;
  END IF;
END $$;

-- Add reveal_timing column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'card_templates' AND column_name = 'reveal_timing') THEN
    ALTER TABLE card_templates ADD COLUMN reveal_timing JSONB;
  END IF;
END $$;

-- Migrate existing reveal_next_conditions to the new system
UPDATE card_templates 
SET 
  completion_rules = CASE 
    WHEN type = 'form' AND reveal_next_conditions->>'type' = 'all_complete' THEN 
      '{"form_completion": {"type": "all_fields"}}'::jsonb
    WHEN type = 'form' AND reveal_next_conditions->>'type' = 'required_complete' THEN 
      '{"form_completion": {"type": "required_fields"}}'::jsonb
    WHEN type = 'form' THEN 
      '{"form_completion": {"type": "any_field"}}'::jsonb
    ELSE NULL
  END,
  reveal_timing = CASE 
    WHEN reveal_next_conditions->>'type' = 'after_delay' THEN 
      jsonb_build_object('timing', 'after_delay', 'delay_seconds', COALESCE((reveal_next_conditions->>'delay_seconds')::int, 3))
    WHEN reveal_next_conditions IS NOT NULL THEN 
      '{"timing": "immediately"}'::jsonb
    ELSE '{"timing": "immediately"}'::jsonb
  END
WHERE completion_rules IS NULL OR reveal_timing IS NULL;