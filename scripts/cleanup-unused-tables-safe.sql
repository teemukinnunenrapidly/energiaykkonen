-- =====================================================
-- TURVALLINEN käyttämättömien taulujen poistoskripti
-- =====================================================
-- Tämä skripti tarkistaa ja poistaa taulut turvallisesti
-- Suorita tämä skripti Supabase SQL Editorissa
-- =====================================================

-- Varmista, että olet oikeassa tietokannassa
SELECT current_database(), current_user;

-- =====================================================
-- 1. Tarkista taulujen olemassaolo ja rivimäärät
-- =====================================================

SELECT 
    'analytics_events' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') 
         THEN (SELECT COUNT(*) FROM analytics_events)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'data_retention_log' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_retention_log') 
         THEN (SELECT COUNT(*) FROM data_retention_log)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'visual_assets' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visual_assets') 
         THEN (SELECT COUNT(*) FROM visual_assets)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'visual_object_views' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visual_object_views') 
         THEN (SELECT COUNT(*) FROM visual_object_views)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'card_calculations' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'card_calculations') 
         THEN (SELECT COUNT(*) FROM card_calculations)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'form_sessions' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_sessions') 
         THEN (SELECT COUNT(*) FROM form_sessions)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'form_calculations' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_calculations') 
         THEN (SELECT COUNT(*) FROM form_calculations)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'formula_lookups' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'formula_lookups') 
         THEN (SELECT COUNT(*) FROM formula_lookups)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'formula_lookup_conditions' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'formula_lookup_conditions') 
         THEN (SELECT COUNT(*) FROM formula_lookup_conditions)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'session_calculations_backup' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_calculations_backup') 
         THEN (SELECT COUNT(*) FROM session_calculations_backup)::text
         ELSE 'NOT EXISTS' 
    END as row_count
UNION ALL
SELECT 
    'themes' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'themes') 
         THEN (SELECT COUNT(*) FROM themes)::text
         ELSE 'NOT EXISTS' 
    END as row_count;

-- =====================================================
-- 2. Tarkista foreign key -riippuvuudet
-- =====================================================

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name IN (
    'analytics_events', 'data_retention_log', 'visual_assets', 
    'visual_object_views', 'card_calculations', 'form_sessions', 
    'form_calculations', 'formula_lookups', 'formula_lookup_conditions', 
    'session_calculations_backup', 'themes'
  );

-- =====================================================
-- 3. Varmista, että tärkeät taulut ovat olemassa
-- =====================================================

SELECT 
    'leads' as critical_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING - DO NOT PROCEED!' 
    END as status
UNION ALL
SELECT 
    'card_templates' as critical_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'card_templates') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING - DO NOT PROCEED!' 
    END as status
UNION ALL
SELECT 
    'formulas' as critical_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'formulas') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING - DO NOT PROCEED!' 
    END as status
UNION ALL
SELECT 
    'visual_objects' as critical_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visual_objects') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING - DO NOT PROCEED!' 
    END as status;

-- =====================================================
-- 4. Jos kaikki tärkeät taulut ovat olemassa, 
--    voit suorittaa poistoskriptin
-- =====================================================

-- HUOMIO: Poista kommentit seuraavista riveistä vain jos:
-- 1. Kaikki tärkeät taulut ovat olemassa (yllä oleva kysely näytti ✅)
-- 2. Foreign key -kysely palautti tyhjän tuloksen
-- 3. Olet varma, että haluat poistaa nämä taulut

/*
-- Poista käyttämättömät taulut
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.data_retention_log CASCADE;
DROP TABLE IF EXISTS public.visual_assets CASCADE;
DROP TABLE IF EXISTS public.visual_object_views CASCADE;
DROP TABLE IF EXISTS public.card_calculations CASCADE;
DROP TABLE IF EXISTS public.form_sessions CASCADE;
DROP TABLE IF EXISTS public.form_calculations CASCADE;
DROP TABLE IF EXISTS public.formula_lookups CASCADE;
DROP TABLE IF EXISTS public.formula_lookup_conditions CASCADE;
DROP TABLE IF EXISTS public.session_calculations_backup CASCADE;
DROP TABLE IF EXISTS public.themes CASCADE;

-- Varmista poistaminen
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
*/

-- =====================================================
-- LOPPU
-- =====================================================
-- Tarkista tulokset yllä olevista kyselyistä
-- Jos kaikki näyttää hyvältä, poista kommentit 
-- poistoskriptistä ja suorita uudelleen
-- =====================================================
