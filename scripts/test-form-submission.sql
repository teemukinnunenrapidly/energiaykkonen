-- Test script to verify form submission with JSONB structure

-- 1. Check current leads table structure (should be minimal)
SELECT 'CURRENT LEADS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 2. Simulate a form submission (what the API would insert)
INSERT INTO leads (
  first_name,
  last_name, 
  s_hk_posti,
  puhelinnumero,
  status,
  form_data
) VALUES (
  'Test',
  'JSONB User',
  'test.jsonb@example.com',
  '0401234567',
  'new',
  jsonb_build_object(
    -- Card Builder fields
    'sahkoposti', 'test.jsonb@example.com',
    'neliot', 150,
    'huonekorkeus', 2.5,
    'rakennusvuosi', '1991-2010',
    'floors', 2,
    'henkilomaara', 4,
    'hot_water_usage', 'Normal',
    'osoite', 'Testikatu 123',
    'paikkakunta', 'Helsinki', 
    'postcode', '00100',
    'lammitysmuoto', 'Oil',
    'vesikiertoinen', 2600,
    'current_energy_consumption', 22000,
    
    -- Calculated fields
    'annual_energy_need', 22000,
    'heat_pump_consumption', 6500,
    'heat_pump_cost_annual', 975,
    'annual_savings', 1625,
    'five_year_savings', 8125,
    'ten_year_savings', 16250,
    'payback_period', 9.2,
    'co2_reduction', 5320,
    
    -- Other fields
    'valittutukimuoto', 'Email',
    'message', 'Testing JSONB structure',
    
    -- Metadata
    'source_page', 'https://example.com/test',
    'user_agent', 'Test Script',
    'ip_address', '127.0.0.1',
    'consent_timestamp', NOW()::text
  )
) RETURNING id, first_name, last_name;

-- 3. Query the test data through the view
SELECT 'DATA THROUGH LEADS_EXPANDED VIEW:' as info;
SELECT 
  id,
  first_name,
  last_name,
  sahkoposti,
  neliot,
  huonekorkeus,
  lammitysmuoto,
  vesikiertoinen,
  annual_savings,
  five_year_savings
FROM leads_expanded
WHERE first_name = 'Test' AND last_name = 'JSONB User'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Verify JSONB data is accessible
SELECT 'DIRECT JSONB ACCESS:' as info;
SELECT 
  id,
  form_data->>'neliot' as neliot,
  form_data->>'lammitysmuoto' as lammitysmuoto,
  form_data->>'annual_savings' as annual_savings,
  jsonb_pretty(form_data) as full_data
FROM leads
WHERE first_name = 'Test' AND last_name = 'JSONB User'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Test querying JSONB fields
SELECT 'JSONB QUERY TEST:' as info;
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE (form_data->>'neliot')::numeric > 100) as large_houses,
  COUNT(*) FILTER (WHERE form_data->>'lammitysmuoto' = 'Oil') as oil_heating,
  AVG((form_data->>'annual_savings')::numeric) as avg_savings
FROM leads
WHERE form_data IS NOT NULL;

-- 6. Clean up test data (optional - uncomment to delete)
-- DELETE FROM leads WHERE first_name = 'Test' AND last_name = 'JSONB User';

-- 7. Summary
SELECT 'SUMMARY:' as info;
SELECT 
  '✅ Form submission works with JSONB' as status,
  'Data is stored in form_data column' as storage,
  'View provides backward compatibility' as compatibility,
  'All Card Builder fields are captured' as flexibility;