-- Migration: Fix multiple active themes issue
-- Ensures only one theme can be active at a time

-- First, deactivate all themes
UPDATE themes SET is_active = false;

-- Then, activate only the Energiaykkonen Minimal theme
UPDATE themes 
SET is_active = true 
WHERE name = 'Energiaykkonen Minimal';

-- If no Energiaykkonen Minimal theme exists, activate the first theme
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM themes WHERE is_active = true) THEN
    UPDATE themes 
    SET is_active = true 
    WHERE id = (SELECT id FROM themes ORDER BY created_at ASC LIMIT 1);
  END IF;
END $$;