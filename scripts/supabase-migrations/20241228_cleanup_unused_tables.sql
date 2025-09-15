-- =====================================================
-- Migraatio: Poista käyttämättömät taulut
-- Päivämäärä: 2024-12-28
-- Kuvaus: Poistaa taulut, joita ei käytetä koodikannassa
-- =====================================================

-- Varmista, että olemme oikeassa tietokannassa
DO $$
BEGIN
    IF current_database() NOT LIKE '%supabase%' THEN
        RAISE WARNING 'Tämä migraatio on tarkoitettu Supabase-tietokantaan';
    END IF;
END $$;

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

-- Tarkista, että taulut on poistettu
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'analytics_events', 'data_retention_log', 'visual_assets', 
        'visual_object_views', 'card_calculations', 'form_sessions', 
        'form_calculations', 'formula_lookups', 'formula_lookup_conditions', 
        'session_calculations_backup', 'themes'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = table_name;
        
        IF table_count > 0 THEN
            RAISE WARNING 'Taulu % on edelleen olemassa!', table_name;
        ELSE
            RAISE NOTICE 'Taulu % poistettu onnistuneesti', table_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 3. Varmista, että tärkeät taulut ovat edelleen olemassa
-- =====================================================

DO $$
DECLARE
    critical_tables TEXT[] := ARRAY['leads', 'card_templates', 'formulas', 'visual_objects'];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY critical_tables
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = table_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            RAISE EXCEPTION 'KRITINEN VIRHE: Taulu % puuttuu! Migraatio keskeytetty.', table_name;
        ELSE
            RAISE NOTICE '✅ Taulu % on olemassa', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Kaikki tärkeät taulut ovat olemassa. Migraatio valmis.';
END $$;

-- =====================================================
-- LOPPU
-- =====================================================
-- Migraatio suoritettu onnistuneesti!
-- 11 käyttämätöntä taulua poistettu
-- =====================================================
