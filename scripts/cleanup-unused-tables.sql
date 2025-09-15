-- =====================================================
-- Käyttämättömien taulujen poistoskripti
-- =====================================================
-- Tämä skripti poistaa taulut, joita ei käytetä koodikannassa
-- Suorita tämä skripti Supabase SQL Editorissa
-- =====================================================

-- Varmista, että olet oikeassa tietokannassa
SELECT current_database(), current_user;

-- =====================================================
-- 1. Poista käyttämättömät taulut
-- =====================================================

-- Poista analytics_events (ei käytetä koodissa, vaikka on 11 riviä dataa)
DROP TABLE IF EXISTS public.analytics_events CASCADE;

-- Poista data_retention_log (ei käytetä koodissa, tyhjä taulu)
DROP TABLE IF EXISTS public.data_retention_log CASCADE;

-- Poista visual_assets (ei käytetä koodissa, tyhjä taulu)
DROP TABLE IF EXISTS public.visual_assets CASCADE;

-- Poista visual_object_views (ei käytetä koodissa, tyhjä taulu)
DROP TABLE IF EXISTS public.visual_object_views CASCADE;

-- Poista card_calculations (ei käytetä koodissa, tyhjä taulu)
DROP TABLE IF EXISTS public.card_calculations CASCADE;

-- Poista form_sessions (ei käytetä koodissa, tyhjä taulu)
DROP TABLE IF EXISTS public.form_sessions CASCADE;

-- Poista form_calculations (ei käytetä koodissa, tyhjä taulu)
DROP TABLE IF EXISTS public.form_calculations CASCADE;

-- Poista formula_lookups (ei käytetä koodissa, vaikka on 2 riviä dataa)
DROP TABLE IF EXISTS public.formula_lookups CASCADE;

-- Poista formula_lookup_conditions (ei käytetä koodissa, vaikka on 5 riviä dataa)
DROP TABLE IF EXISTS public.formula_lookup_conditions CASCADE;

-- Poista session_calculations_backup (ei käytetä koodissa, vaikka on 2 riviä dataa)
DROP TABLE IF EXISTS public.session_calculations_backup CASCADE;

-- Poista themes (ei käytetä koodissa, vaikka on 1 rivi dataa)
DROP TABLE IF EXISTS public.themes CASCADE;

-- =====================================================
-- 2. Varmista poistaminen
-- =====================================================

-- Listaa jäljellä olevat taulut
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 3. Tarkista, että kaikki tärkeät taulut ovat edelleen olemassa
-- =====================================================

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') 
        THEN '✅ leads table exists'
        ELSE '❌ leads table missing'
    END as leads_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'card_templates') 
        THEN '✅ card_templates table exists'
        ELSE '❌ card_templates table missing'
    END as card_templates_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'formulas') 
        THEN '✅ formulas table exists'
        ELSE '❌ formulas table missing'
    END as formulas_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visual_objects') 
        THEN '✅ visual_objects table exists'
        ELSE '❌ visual_objects table missing'
    END as visual_objects_status;

-- =====================================================
-- 4. Näytä tilastot
-- =====================================================

-- Laske jäljellä olevien taulujen määrä
SELECT 
    COUNT(*) as remaining_tables,
    'Tauluja jäljellä' as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- =====================================================
-- LOPPU
-- =====================================================
-- Skripti suoritettu onnistuneesti!
-- 11 käyttämätöntä taulua poistettu
-- =====================================================
