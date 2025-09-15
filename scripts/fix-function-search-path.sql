-- =====================================================
-- Korjaa Function Search Path -ongelmat
-- =====================================================
-- Lisää SET search_path = '' kaikkiin funktioihin turvallisuuden parantamiseksi
-- =====================================================

-- 1. update_formulas_updated_at
CREATE OR REPLACE FUNCTION public.update_formulas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 2. increment
CREATE OR REPLACE FUNCTION public.increment()
RETURNS integer
LANGUAGE sql
SET search_path = ''
AS $function$
  SELECT 1;
$function$;

-- 3. update_completion_timestamp
CREATE OR REPLACE FUNCTION public.update_completion_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
$function$;

-- 4. update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 5. get_form_stream_cards
CREATE OR REPLACE FUNCTION public.get_form_stream_cards(stream_slug character varying)
RETURNS TABLE(card_id uuid, name character varying, display_order integer, type character varying, title character varying, config jsonb, reveal_conditions jsonb, styling jsonb, visual_object_id uuid, card_position integer, is_visible boolean)
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ct.id as card_id,
        ct.name,
        ct.display_order,
        ct.type,
        ct.title,
        ct.config,
        ct.reveal_conditions,
        ct.styling,
        ct.visual_object_id,
        fsc.card_position,
        fsc.is_visible
    FROM form_stream_cards fsc
    JOIN form_streams fs ON fsc.stream_id = fs.id
    JOIN card_templates ct ON fsc.card_template_id = ct.id
    WHERE fs.slug = stream_slug 
        AND fs.is_active = true 
        AND ct.is_active = true
        AND fsc.is_visible = true
    ORDER BY fsc.card_position ASC;
END;
$function$;

-- 6. get_form_session_progress
CREATE OR REPLACE FUNCTION public.get_form_session_progress(session_uuid uuid)
RETURNS TABLE(session_id uuid, stream_name character varying, current_position integer, total_cards integer, completion_percentage numeric, is_completed boolean)
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        fs.id as session_id,
        fstr.name as stream_name,
        fs.current_card_position,
        COUNT(fsc.id) as total_cards,
        CASE 
            WHEN COUNT(fsc.id) > 0 THEN 
                ROUND((fs.current_card_position::NUMERIC / COUNT(fsc.id)::NUMERIC) * 100, 2)
            ELSE 0 
        END as completion_percentage,
        fs.is_completed
    FROM form_sessions fs
    JOIN form_streams fstr ON fs.stream_id = fstr.id
    LEFT JOIN form_stream_cards fsc ON fstr.id = fsc.stream_id AND fsc.is_visible = true
    WHERE fs.id = session_uuid
    GROUP BY fs.id, fstr.name, fs.current_card_position, fs.is_completed;
END;
$function$;

-- 7. update_formula_lookups_updated_at
CREATE OR REPLACE FUNCTION public.update_formula_lookups_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
$function$;

-- 8. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 9. set_data_retention_date
CREATE OR REPLACE FUNCTION public.set_data_retention_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    -- Set retention date based on lead status
    -- Active leads: 2 years from last contact
    -- Converted customers: 7 years for warranty/legal purposes
    -- Default: 2 years from creation
    
    IF NEW.status = 'converted' THEN
        NEW.data_retention_date = NEW.created_at + INTERVAL '7 years';
    ELSE
        NEW.data_retention_date = NEW.created_at + INTERVAL '2 years';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 10. anonymize_expired_leads
CREATE OR REPLACE FUNCTION public.anonymize_expired_leads()
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Anonymize personal data for leads past retention date
    UPDATE leads 
    SET 
        first_name = 'ANONYMIZED',
        last_name = 'ANONYMIZED',
        email = 'anonymized_' || id || '@example.com',
        phone = 'ANONYMIZED',
        street_address = NULL,
        city = 'ANONYMIZED',
        message = NULL,
        ip_address = NULL,
        user_agent = 'ANONYMIZED',
        anonymized = true,
        updated_at = NOW()
    WHERE 
        data_retention_date < NOW() 
        AND anonymized = false
        AND status != 'converted'; -- Don't anonymize converted customers (7-year retention)
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the anonymization event
    INSERT INTO data_retention_log (
        action_type,
        affected_records,
        executed_at,
        details
    ) VALUES (
        'anonymization',
        affected_rows,
        NOW(),
        'Automated anonymization of expired lead data'
    );
    
    RETURN affected_rows;
END;
$function$;

-- 11. export_lead_data
CREATE OR REPLACE FUNCTION public.export_lead_data(lead_email character varying)
RETURNS json
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    lead_data JSON;
BEGIN
    -- Export all personal data for a specific email address
    SELECT json_build_object(
        'personal_data', json_build_object(
            'id', id,
            'first_name', first_name,
            'last_name', last_name,
            'email', email,
            'phone', phone,
            'street_address', street_address,
            'city', city,
            'contact_preference', contact_preference,
            'message', message
        ),
        'property_data', json_build_object(
            'square_meters', square_meters,
            'ceiling_height', ceiling_height,
            'construction_year', construction_year,
            'floors', floors,
            'heating_type', heating_type,
            'current_heating_cost', current_heating_cost,
            'residents', residents,
            'hot_water_usage', hot_water_usage
        ),
        'calculations', json_build_object(
            'annual_energy_need', annual_energy_need,
            'heat_pump_consumption', heat_pump_consumption,
            'annual_savings', annual_savings,
            'five_year_savings', five_year_savings,
            'ten_year_savings', ten_year_savings,
            'payback_period', payback_period,
            'co2_reduction', co2_reduction
        ),
        'consent_data', json_build_object(
            'gdpr_consent', gdpr_consent,
            'marketing_consent', marketing_consent,
            'consent_timestamp', consent_timestamp
        ),
        'metadata', json_build_object(
            'created_at', created_at,
            'updated_at', updated_at,
            'status', status,
            'data_retention_date', data_retention_date,
            'anonymized', anonymized
        )
    ) INTO lead_data
    FROM leads 
    WHERE email = lead_email AND anonymized = false;
    
    -- Log the data access
    IF lead_data IS NOT NULL THEN
        INSERT INTO data_retention_log (
            action_type,
            executed_at,
            lead_id,
            details
        ) VALUES (
            'access_request',
            NOW(),
            (SELECT id FROM leads WHERE email = lead_email LIMIT 1),
            'GDPR data access request for email: ' || lead_email
        );
    END IF;
    
    RETURN COALESCE(lead_data, '{"error": "No data found for this email address"}'::json);
END;
$function$;

-- 12. delete_lead_data
CREATE OR REPLACE FUNCTION public.delete_lead_data(lead_email character varying)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    lead_id_to_delete UUID;
    deleted_count INTEGER;
BEGIN
    -- Get the lead ID first
    SELECT id INTO lead_id_to_delete 
    FROM leads 
    WHERE email = lead_email AND anonymized = false;
    
    IF lead_id_to_delete IS NULL THEN
        RETURN false;
    END IF;
    
    -- Delete the lead data
    DELETE FROM leads WHERE id = lead_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the deletion
    IF deleted_count > 0 THEN
        INSERT INTO data_retention_log (
            action_type,
            affected_records,
            executed_at,
            lead_id,
            details
        ) VALUES (
            'deletion',
            deleted_count,
            NOW(),
            lead_id_to_delete,
            'GDPR data deletion request for email: ' || lead_email
        );
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$;

-- 13. cleanup_old_analytics
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete analytics events older than 2 years (configurable)
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO data_retention_log (
        action_type,
        affected_records,
        executed_at,
        details
    ) VALUES (
        'deletion',
        deleted_count,
        NOW(),
        'Automated cleanup of analytics events older than 2 years'
    );
    
    RETURN deleted_count;
END;
$function$;

-- =====================================================
-- Varmista korjaukset
-- =====================================================

-- Tarkista, että kaikki funktiot on korjattu
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.proconfig as function_config,
    CASE 
        WHEN p.proconfig IS NULL OR 'search_path=' NOT IN (SELECT unnest(p.proconfig)) 
        THEN '❌ NEEDS FIX'
        ELSE '✅ FIXED'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN (
    'update_formulas_updated_at', 'increment', 'update_completion_timestamp', 
    'update_updated_at', 'get_form_stream_cards', 'get_form_session_progress',
    'update_formula_lookups_updated_at', 'update_updated_at_column', 
    'set_data_retention_date', 'anonymize_expired_leads', 'export_lead_data', 
    'delete_lead_data', 'cleanup_old_analytics'
  )
ORDER BY p.proname;
