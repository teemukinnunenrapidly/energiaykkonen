-- Migration: Create Form Card Stream System
-- Date: 2024-12-19
-- Description: Creates the form card stream system for multi-step forms with calculations

-- Card Templates table (for building multi-step forms)
CREATE TABLE card_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('form', 'calculation', 'info', 'visual', 'submit')),
  title VARCHAR(255),
  config JSONB NOT NULL DEFAULT '{}',
  reveal_conditions JSONB DEFAULT '[]',
  styling JSONB DEFAULT '{}',
  visual_object_id UUID REFERENCES visual_objects(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Streams table (for organizing form flows)
CREATE TABLE form_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Stream Cards (many-to-many relationship with positioning)
CREATE TABLE form_stream_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES form_streams(id) ON DELETE CASCADE,
  card_template_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stream_id, position)
);

-- Form Sessions table (for tracking user form progress)
CREATE TABLE form_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES form_streams(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255), -- Session ID or user ID
  current_card_position INTEGER DEFAULT 0,
  form_data JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false
);

-- Form Responses table (for storing user inputs)
CREATE TABLE form_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES form_sessions(id) ON DELETE CASCADE,
  card_template_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Calculations table (for storing calculation results)
CREATE TABLE form_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES form_sessions(id) ON DELETE CASCADE,
  calculation_type VARCHAR(100) NOT NULL,
  input_values JSONB NOT NULL,
  result_values JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to document the tables
COMMENT ON TABLE card_templates IS 'Templates for different types of form cards (form, calculation, info, visual, submit)';
COMMENT ON TABLE form_streams IS 'Named form flows that organize card sequences';
COMMENT ON TABLE form_stream_cards IS 'Many-to-many relationship between streams and cards with positioning';
COMMENT ON TABLE form_sessions IS 'User sessions for tracking form progress and completion';
COMMENT ON TABLE form_responses IS 'User input data for each card in a form session';
COMMENT ON TABLE form_calculations IS 'Calculation results based on user inputs';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_card_templates_type ON card_templates(type);
CREATE INDEX IF NOT EXISTS idx_card_templates_active ON card_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_card_templates_display_order ON card_templates(display_order);
CREATE INDEX IF NOT EXISTS idx_card_templates_visual_object ON card_templates(visual_object_id);

CREATE INDEX IF NOT EXISTS idx_form_streams_slug ON form_streams(slug);
CREATE INDEX IF NOT EXISTS idx_form_streams_active ON form_streams(is_active);

CREATE INDEX IF NOT EXISTS idx_form_stream_cards_stream_position ON form_stream_cards(stream_id, position);
CREATE INDEX IF NOT EXISTS idx_form_stream_cards_template ON form_stream_cards(card_template_id);
CREATE INDEX IF NOT EXISTS idx_form_stream_cards_visible ON form_stream_cards(is_visible);

CREATE INDEX IF NOT EXISTS idx_form_sessions_stream ON form_sessions(stream_id);
CREATE INDEX IF NOT EXISTS idx_form_sessions_user ON form_sessions(user_identifier);
CREATE INDEX IF NOT EXISTS idx_form_sessions_completed ON form_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_form_sessions_activity ON form_sessions(last_activity);

CREATE INDEX IF NOT EXISTS idx_form_responses_session ON form_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_card ON form_responses(card_template_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_created ON form_responses(responded_at);

CREATE INDEX IF NOT EXISTS idx_form_calculations_session ON form_calculations(session_id);
CREATE INDEX IF NOT EXISTS idx_form_calculations_type ON form_calculations(calculation_type);
CREATE INDEX IF NOT EXISTS idx_form_calculations_created ON form_calculations(calculated_at);

-- Insert default form stream
INSERT INTO form_streams (id, name, description, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Energy Calculator Form', 'Multi-step energy calculation form', 'energy-calculator')
ON CONFLICT DO NOTHING;

-- Insert sample card templates
INSERT INTO card_templates (id, name, display_order, type, title, config) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Property Information', 1, 'form', 'Property Details', '{"fields": ["property_type", "square_meters", "year_built"], "validation": {"required": true}}'),
  ('00000000-0000-0000-0000-000000000002', 'Energy Usage', 2, 'form', 'Current Energy Consumption', '{"fields": ["heating_type", "electricity_usage", "heating_usage"], "validation": {"required": true}}'),
  ('00000000-0000-0000-0000-000000000003', 'Energy Calculation', 3, 'calculation', 'Energy Savings Estimate', '{"formula": "energy_savings_calculation", "inputs": ["property_type", "square_meters", "heating_type", "electricity_usage"]}'),
  ('00000000-0000-0000-0000-000000000004', 'Results Display', 4, 'info', 'Your Energy Savings', '{"display_type": "results_summary", "show_charts": true, "show_recommendations": true}'),
  ('00000000-0000-0000-0000-000000000005', 'Submit Form', 5, 'submit', 'Complete Calculation', '{"submit_text": "Get Full Report", "redirect_url": "/results"}')
ON CONFLICT DO NOTHING;

-- Insert sample form stream cards
INSERT INTO form_stream_cards (stream_id, card_template_id, position) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 2),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 3),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 4),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 5)
ON CONFLICT DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_card_templates_updated_at 
    BEFORE UPDATE ON card_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_streams_updated_at 
    BEFORE UPDATE ON form_streams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get form stream cards with proper ordering
CREATE OR REPLACE FUNCTION get_form_stream_cards(stream_slug VARCHAR)
RETURNS TABLE (
    card_id UUID,
    name VARCHAR(255),
    display_order INTEGER,
    type VARCHAR(50),
    title VARCHAR(255),
    config JSONB,
    reveal_conditions JSONB,
    styling JSONB,
    visual_object_id UUID,
    position INTEGER,
    is_visible BOOLEAN
) AS $$
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
        fsc.position,
        fsc.is_visible
    FROM form_stream_cards fsc
    JOIN form_streams fs ON fsc.stream_id = fs.id
    JOIN card_templates ct ON fsc.card_template_id = ct.id
    WHERE fs.slug = stream_slug 
        AND fs.is_active = true 
        AND ct.is_active = true
        AND fsc.is_visible = true
    ORDER BY fsc.position ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get form session progress
CREATE OR REPLACE FUNCTION get_form_session_progress(session_uuid UUID)
RETURNS TABLE (
    session_id UUID,
    stream_name VARCHAR(255),
    current_position INTEGER,
    total_cards INTEGER,
    completion_percentage NUMERIC,
    is_completed BOOLEAN
) AS $$
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
$$ LANGUAGE plpgsql;
