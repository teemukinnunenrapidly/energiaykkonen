-- Add calculation_results column to leads table
-- This column will store all calculated values needed for PDF generation

-- Add the calculation_results column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'calculation_results'
  ) THEN
    ALTER TABLE leads ADD COLUMN calculation_results jsonb DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN leads.calculation_results IS 'Stores calculated values at submission time for PDF generation';
  END IF;
END $$;

-- Recreate the leads_expanded view to include calculation_results
DROP VIEW IF EXISTS leads_expanded CASCADE;

CREATE OR REPLACE VIEW leads_expanded AS
SELECT 
  l.id,
  l.nimi,
  l.sahkoposti,
  l.puhelinnumero,
  l.paikkakunta,
  l.osoite,
  l.status,
  l.created_at,
  l.updated_at,
  l.form_data,
  l.calculation_results,
  
  -- Extract commonly used fields from form_data for convenience
  (l.form_data->>'neliot')::numeric as neliot,
  (l.form_data->>'huonekorkeus')::numeric as huonekorkeus,
  l.form_data->>'rakennusvuosi' as rakennusvuosi,
  (l.form_data->>'floors')::integer as floors,
  l.form_data->>'lammitysmuoto' as lammitysmuoto,
  
  -- Extract key metrics from calculation_results
  (l.calculation_results->>'annual_savings')::numeric as annual_savings,
  (l.calculation_results->>'five_year_savings')::numeric as five_year_savings,
  (l.calculation_results->>'ten_year_savings')::numeric as ten_year_savings,
  (l.calculation_results->>'payback_period')::numeric as payback_period,
  (l.calculation_results->>'co2_reduction')::numeric as co2_reduction,
  
  -- Metadata from form_data
  l.form_data->>'source_page' as source_page,
  l.form_data->>'user_agent' as user_agent,
  l.form_data->>'ip_address' as ip_address
FROM leads l;

-- Grant appropriate permissions on the view
GRANT SELECT ON leads_expanded TO authenticated;
GRANT SELECT ON leads_expanded TO anon;

-- Verify the structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;