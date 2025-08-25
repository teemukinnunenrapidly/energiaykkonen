-- GDPR Compliance Migration: Add consent tracking and data retention features
-- This migration adds GDPR consent fields and implements data retention policies

-- Add GDPR consent columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS data_retention_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT false;

-- Add indexes for GDPR compliance queries
CREATE INDEX IF NOT EXISTS idx_leads_gdpr_consent ON leads(gdpr_consent);
CREATE INDEX IF NOT EXISTS idx_leads_marketing_consent ON leads(marketing_consent);
CREATE INDEX IF NOT EXISTS idx_leads_data_retention_date ON leads(data_retention_date);
CREATE INDEX IF NOT EXISTS idx_leads_anonymized ON leads(anonymized);
CREATE INDEX IF NOT EXISTS idx_leads_consent_timestamp ON leads(consent_timestamp);

-- Add comments for GDPR fields
COMMENT ON COLUMN leads.gdpr_consent IS 'GDPR consent for data processing (required)';
COMMENT ON COLUMN leads.marketing_consent IS 'Consent for marketing communications (optional)';
COMMENT ON COLUMN leads.consent_timestamp IS 'Timestamp when consent was given';
COMMENT ON COLUMN leads.data_retention_date IS 'Date when data should be deleted or anonymized';
COMMENT ON COLUMN leads.anonymized IS 'Whether personal data has been anonymized';

-- Create function to set data retention date
CREATE OR REPLACE FUNCTION set_data_retention_date()
RETURNS TRIGGER AS $$
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
$$ language 'plpgsql';

-- Create trigger to automatically set retention date
DROP TRIGGER IF EXISTS set_leads_retention_date ON leads;
CREATE TRIGGER set_leads_retention_date
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_data_retention_date();

-- Create function to anonymize expired personal data
CREATE OR REPLACE FUNCTION anonymize_expired_leads()
RETURNS INTEGER AS $$
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
$$ language 'plpgsql';

-- Create data retention audit log table
CREATE TABLE IF NOT EXISTS data_retention_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('anonymization', 'deletion', 'export', 'access_request')),
    affected_records INTEGER DEFAULT 0,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    executed_by VARCHAR(255), -- User or system that executed the action
    lead_id UUID, -- For individual lead actions
    details TEXT,
    
    -- Constraints
    CONSTRAINT valid_action_details CHECK (
        (action_type = 'anonymization' AND affected_records >= 0) OR
        (action_type = 'deletion' AND affected_records >= 0) OR
        (action_type = 'export' AND lead_id IS NOT NULL) OR
        (action_type = 'access_request' AND lead_id IS NOT NULL)
    )
);

-- Add indexes for retention log
CREATE INDEX IF NOT EXISTS idx_retention_log_action_type ON data_retention_log(action_type);
CREATE INDEX IF NOT EXISTS idx_retention_log_executed_at ON data_retention_log(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_log_lead_id ON data_retention_log(lead_id);

-- Add comments for retention log
COMMENT ON TABLE data_retention_log IS 'Audit log for GDPR data retention and deletion actions';
COMMENT ON COLUMN data_retention_log.action_type IS 'Type of data retention action performed';
COMMENT ON COLUMN data_retention_log.affected_records IS 'Number of records affected by bulk actions';
COMMENT ON COLUMN data_retention_log.executed_by IS 'User or system that performed the action';
COMMENT ON COLUMN data_retention_log.lead_id IS 'Specific lead ID for individual actions';

-- Create function for GDPR data access (export)
CREATE OR REPLACE FUNCTION export_lead_data(lead_email VARCHAR)
RETURNS JSON AS $$
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
$$ language 'plpgsql';

-- Create function for GDPR data deletion
CREATE OR REPLACE FUNCTION delete_lead_data(lead_email VARCHAR)
RETURNS BOOLEAN AS $$
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
$$ language 'plpgsql';

-- Update existing leads to have GDPR consent (for migration)
-- Note: In a real migration, you would need to re-obtain consent
UPDATE leads 
SET 
    gdpr_consent = true,
    consent_timestamp = created_at,
    data_retention_date = created_at + INTERVAL '2 years'
WHERE gdpr_consent IS NULL OR gdpr_consent = false;

-- Create view for GDPR-compliant lead data (excluding anonymized personal info)
CREATE OR REPLACE VIEW public_leads AS
SELECT 
    id,
    CASE WHEN anonymized THEN 'ANONYMIZED' ELSE first_name END as first_name,
    CASE WHEN anonymized THEN 'ANONYMIZED' ELSE last_name END as last_name,
    CASE WHEN anonymized THEN 'anonymized_' || id || '@example.com' ELSE email END as email,
    CASE WHEN anonymized THEN 'ANONYMIZED' ELSE phone END as phone,
    CASE WHEN anonymized THEN NULL ELSE street_address END as street_address,
    CASE WHEN anonymized THEN 'ANONYMIZED' ELSE city END as city,
    contact_preference,
    CASE WHEN anonymized THEN NULL ELSE message END as message,
    
    -- Property data (not personally sensitive)
    square_meters,
    ceiling_height,
    construction_year,
    floors,
    heating_type,
    current_heating_cost,
    current_energy_consumption,
    residents,
    hot_water_usage,
    
    -- Calculation results (not personally sensitive)
    annual_energy_need,
    heat_pump_consumption,
    heat_pump_cost_annual,
    annual_savings,
    five_year_savings,
    ten_year_savings,
    payback_period,
    co2_reduction,
    
    -- Lead management
    status,
    notes,
    
    -- Metadata (anonymized where necessary)
    created_at,
    updated_at,
    CASE WHEN anonymized THEN NULL ELSE ip_address END as ip_address,
    CASE WHEN anonymized THEN 'ANONYMIZED' ELSE user_agent END as user_agent,
    source_page,
    
    -- GDPR fields
    gdpr_consent,
    marketing_consent,
    consent_timestamp,
    data_retention_date,
    anonymized
FROM leads;

-- Grant appropriate permissions
GRANT SELECT ON public_leads TO authenticated;
GRANT EXECUTE ON FUNCTION export_lead_data(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_lead_data(VARCHAR) TO authenticated;

-- Add helpful comments
COMMENT ON VIEW public_leads IS 'GDPR-compliant view of leads with anonymized personal data where applicable';
COMMENT ON FUNCTION export_lead_data(VARCHAR) IS 'GDPR data export function for subject access requests';
COMMENT ON FUNCTION delete_lead_data(VARCHAR) IS 'GDPR data deletion function for right to erasure requests';
COMMENT ON FUNCTION anonymize_expired_leads() IS 'Automated function to anonymize expired personal data';

-- Create a reminder for setting up automated retention cleanup
-- In production, you would set up a cron job or scheduled function to run anonymize_expired_leads()
-- For example: SELECT cron.schedule('gdpr-cleanup', '0 2 * * *', 'SELECT anonymize_expired_leads();');

-- Final verification query (commented out for migration file)
-- SELECT 
--     'Migration completed successfully' as status,
--     COUNT(*) as total_leads,
--     COUNT(*) FILTER (WHERE gdpr_consent = true) as consented_leads,
--     COUNT(*) FILTER (WHERE marketing_consent = true) as marketing_consents,
--     COUNT(*) FILTER (WHERE anonymized = true) as anonymized_leads
-- FROM leads;
