-- Analytics Events Table Migration
-- Create table for storing detailed analytics events from the Heat Pump Calculator

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event identification
    event_name VARCHAR(50) NOT NULL CHECK (event_name IN (
        'page_view', 'form_started', 'step_completed', 'step_error', 
        'form_submitted', 'form_abandoned', 'calculation_completed', 
        'email_requested', 'lead_converted', 'admin_action', 'error_occurred'
    )),
    event_step VARCHAR(20) CHECK (event_step IN (
        'basic-info', 'property-details', 'current-heating', 'results'
    )),
    
    -- Device and source tracking
    device_type VARCHAR(10) CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
    source_page TEXT, -- Page where the event was triggered
    current_page VARCHAR(255), -- Current page path
    
    -- Session and user tracking
    session_id VARCHAR(100), -- Session identifier
    user_id UUID, -- Associated user/lead ID (optional)
    
    -- Event data
    event_value NUMERIC, -- Numeric value (time spent, score, etc.)
    error_message TEXT, -- Error details for error events
    metadata JSONB, -- Additional event-specific data
    
    -- Technical tracking
    ip_address INET, -- Client IP for analytics
    user_agent TEXT, -- Browser/device info
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Event timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_event_data CHECK (
        (event_name = 'error_occurred' AND error_message IS NOT NULL) OR
        (event_name != 'error_occurred')
    )
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_device ON analytics_events(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_step ON analytics_events(event_step);
CREATE INDEX IF NOT EXISTS idx_analytics_events_source ON analytics_events(source_page);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);

-- Composite indexes for common analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_timestamp ON analytics_events(event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_timestamp ON analytics_events(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_device_timestamp ON analytics_events(device_type, timestamp DESC);

-- Add table comments
COMMENT ON TABLE analytics_events IS 'Detailed analytics events for heat pump calculator user interactions';
COMMENT ON COLUMN analytics_events.event_name IS 'Type of event tracked (form_started, step_completed, etc.)';
COMMENT ON COLUMN analytics_events.event_step IS 'Form step where event occurred (if applicable)';
COMMENT ON COLUMN analytics_events.device_type IS 'Device type: mobile, tablet, desktop, or unknown';
COMMENT ON COLUMN analytics_events.source_page IS 'Page URL where the event was triggered';
COMMENT ON COLUMN analytics_events.session_id IS 'Session identifier for tracking user journeys';
COMMENT ON COLUMN analytics_events.user_id IS 'Associated lead/user ID for conversion tracking';
COMMENT ON COLUMN analytics_events.event_value IS 'Numeric value like time spent, completion percentage, etc.';
COMMENT ON COLUMN analytics_events.metadata IS 'JSON metadata with event-specific additional data';

-- Create analytics aggregation views for common queries

-- Daily event summary
CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT 
    DATE(timestamp) as event_date,
    event_name,
    device_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
FROM analytics_events 
GROUP BY DATE(timestamp), event_name, device_type
ORDER BY event_date DESC, event_count DESC;

-- Form conversion funnel
CREATE OR REPLACE VIEW analytics_form_funnel AS
SELECT 
    event_step,
    COUNT(*) as step_views,
    COUNT(*) FILTER (WHERE event_name = 'step_completed') as step_completions,
    COUNT(*) FILTER (WHERE event_name = 'step_error') as step_errors,
    COUNT(*) FILTER (WHERE event_name = 'form_abandoned') as step_abandonments,
    ROUND(
        (COUNT(*) FILTER (WHERE event_name = 'step_completed')::NUMERIC / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) as completion_rate
FROM analytics_events 
WHERE event_step IS NOT NULL
GROUP BY event_step
ORDER BY CASE event_step 
    WHEN 'basic-info' THEN 1
    WHEN 'property-details' THEN 2
    WHEN 'current-heating' THEN 3
    WHEN 'results' THEN 4
    ELSE 5
END;

-- Device analytics
CREATE OR REPLACE VIEW analytics_device_breakdown AS
SELECT 
    device_type,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) FILTER (WHERE event_name = 'form_started') as form_starts,
    COUNT(*) FILTER (WHERE event_name = 'form_submitted') as form_submissions,
    ROUND(
        (COUNT(*) FILTER (WHERE event_name = 'form_submitted')::NUMERIC / 
         NULLIF(COUNT(*) FILTER (WHERE event_name = 'form_started'), 0)) * 100, 2
    ) as conversion_rate
FROM analytics_events 
GROUP BY device_type
ORDER BY total_events DESC;

-- Recent activity (last 24 hours)
CREATE OR REPLACE VIEW analytics_recent_activity AS
SELECT 
    timestamp,
    event_name,
    event_step,
    device_type,
    session_id,
    CASE 
        WHEN error_message IS NOT NULL THEN error_message
        WHEN metadata IS NOT NULL THEN metadata::TEXT
        ELSE 'No additional data'
    END as event_details
FROM analytics_events 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;

-- Grant appropriate permissions
GRANT SELECT ON analytics_events TO authenticated;
GRANT SELECT ON analytics_daily_summary TO authenticated;
GRANT SELECT ON analytics_form_funnel TO authenticated;
GRANT SELECT ON analytics_device_breakdown TO authenticated;
GRANT SELECT ON analytics_recent_activity TO authenticated;

-- Create function for analytics cleanup (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS INTEGER AS $$
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
$$ language 'plpgsql';

-- Add comment for cleanup function
COMMENT ON FUNCTION cleanup_old_analytics() IS 'Automated cleanup of old analytics events for data retention compliance';

-- Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_metadata_gin ON analytics_events USING GIN (metadata);

-- Add final verification
SELECT 
    'Analytics table created successfully' as status,
    COUNT(*) as initial_event_count
FROM analytics_events;
