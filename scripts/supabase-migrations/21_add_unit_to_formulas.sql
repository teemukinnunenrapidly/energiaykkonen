-- Add unit column to formulas table
-- This allows storing the unit (e.g., "kWh", "€", "%", "km") for each formula's result

ALTER TABLE formulas 
ADD COLUMN unit TEXT;

-- Add a comment to document the purpose
COMMENT ON COLUMN formulas.unit IS 'The unit for the calculation result (e.g., "kWh", "€", "%", "km", etc.)';

-- Update existing formulas to have units based on their names (migration helper)
-- This helps migrate existing formulas that relied on hardcoded unit detection

UPDATE formulas 
SET unit = CASE 
    WHEN LOWER(name) LIKE '%kwh%' OR LOWER(name) LIKE '%energia%' OR LOWER(name) LIKE '%energy%' THEN 'kWh'
    WHEN LOWER(name) LIKE '%eur%' OR LOWER(name) LIKE '%euro%' OR LOWER(name) LIKE '%säästö%' OR LOWER(name) LIKE '%saving%' THEN '€'
    WHEN LOWER(name) LIKE '%percent%' OR LOWER(name) LIKE '%prosent%' OR LOWER(name) LIKE '%%' THEN '%'
    WHEN LOWER(name) LIKE '%km%' OR LOWER(name) LIKE '%kilometer%' THEN 'km'
    WHEN LOWER(name) LIKE '%m2%' OR LOWER(name) LIKE '%nelio%' OR LOWER(name) LIKE '%square%' THEN 'm²'
    WHEN LOWER(name) LIKE '%kg%' OR LOWER(name) LIKE '%kilo%' THEN 'kg'
    WHEN LOWER(name) LIKE '%liter%' OR LOWER(name) LIKE '%l%' THEN 'l'
    ELSE NULL
END
WHERE unit IS NULL;