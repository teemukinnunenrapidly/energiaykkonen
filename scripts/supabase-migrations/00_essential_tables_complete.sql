-- Essential Database Schema for E1-calculator
-- This migration creates all the core tables needed for the application

-- 1. CORE CARD SYSTEM TABLES
CREATE TABLE IF NOT EXISTS card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'form',
  description TEXT,
  config JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  reveal_conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  placeholder TEXT,
  validation JSONB DEFAULT '{}',
  width VARCHAR(20) DEFAULT 'full',
  display_order INTEGER DEFAULT 0,
  options JSONB DEFAULT '[]',
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card completion tracking
CREATE TABLE IF NOT EXISTS card_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, session_id)
);

CREATE TABLE IF NOT EXISTS field_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_value TEXT,
  session_id VARCHAR(255) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, field_name, session_id)
);

-- 2. FORMULA SYSTEM
CREATE TABLE IF NOT EXISTS formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  formula_text TEXT NOT NULL,
  formula_type VARCHAR(100) DEFAULT 'energy_calculation',
  unit VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FORMULA LOOKUP SYSTEM (conditional calculations)
CREATE TABLE IF NOT EXISTS formula_lookups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formula_lookup_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_id UUID NOT NULL REFERENCES formula_lookups(id) ON DELETE CASCADE,
  condition_order INTEGER NOT NULL,
  condition_rule TEXT NOT NULL,
  target_shortcode TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lookup_id, condition_order)
);

-- 4. VISUAL ASSETS SYSTEM
CREATE TABLE IF NOT EXISTS visual_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  folder_id UUID,
  object_type VARCHAR(50) DEFAULT 'image',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visual_object_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID REFERENCES visual_objects(id) ON DELETE CASCADE,
  cloudflare_id VARCHAR(255) NOT NULL,
  variant VARCHAR(50) DEFAULT 'public',
  filename VARCHAR(255),
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LEADS/SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Basic contact info
  first_name VARCHAR(255),
  last_name VARCHAR(255), 
  email VARCHAR(255),
  phone VARCHAR(255),
  street_address TEXT,
  city VARCHAR(255),
  contact_preference VARCHAR(50),
  message TEXT,
  
  -- House information
  square_meters DECIMAL,
  ceiling_height DECIMAL,
  construction_year VARCHAR(20),
  floors INTEGER,
  
  -- Current heating
  heating_type VARCHAR(100),
  current_heating_cost DECIMAL,
  current_energy_consumption DECIMAL,
  
  -- Household
  residents INTEGER,
  hot_water_usage VARCHAR(20),
  
  -- Calculated results
  annual_energy_need DECIMAL,
  heat_pump_consumption DECIMAL,
  heat_pump_cost_annual DECIMAL,
  annual_savings DECIMAL,
  five_year_savings DECIMAL,
  ten_year_savings DECIMAL,
  payback_period DECIMAL,
  
  -- Metadata
  session_id VARCHAR(255),
  form_data JSONB DEFAULT '{}',
  gdpr_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_type VARCHAR(100) DEFAULT 'notification',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ANALYTICS (basic structure)
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADD MISSING COLUMNS to existing tables (safe - only adds if not exists)
DO $$ 
BEGIN
    -- Add is_active to card_templates if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_templates' AND column_name='is_active') THEN
        ALTER TABLE card_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add is_active to formulas if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formulas' AND column_name='is_active') THEN
        ALTER TABLE formulas ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add unit to formulas if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formulas' AND column_name='unit') THEN
        ALTER TABLE formulas ADD COLUMN unit VARCHAR(50);
    END IF;
    
    -- Add is_active to visual_objects if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visual_objects' AND column_name='is_active') THEN
        ALTER TABLE visual_objects ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add is_active to email_templates if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='is_active') THEN
        ALTER TABLE email_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- INDEXES for performance (only create if tables exist)
DO $$ 
BEGIN
    -- Only create indexes if the tables and columns exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_templates') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_templates' AND column_name='is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_card_templates_active ON card_templates(is_active);
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_fields') THEN
        CREATE INDEX IF NOT EXISTS idx_card_fields_card_id ON card_fields(card_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_completions') THEN
        CREATE INDEX IF NOT EXISTS idx_card_completions_session ON card_completions(session_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='field_completions') THEN
        CREATE INDEX IF NOT EXISTS idx_field_completions_session ON field_completions(session_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formulas') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formulas' AND column_name='is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_formulas_active ON formulas(is_active);
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formula_lookups') THEN
        CREATE INDEX IF NOT EXISTS idx_formula_lookups_active ON formula_lookups(is_active);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formula_lookup_conditions') THEN
        CREATE INDEX IF NOT EXISTS idx_formula_lookup_conditions_lookup ON formula_lookup_conditions(lookup_id, condition_order);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visual_objects') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visual_objects' AND column_name='is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_visual_objects_active ON visual_objects(is_active);
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='leads') THEN
        CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
        CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='email_templates') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='analytics') THEN
        CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
        CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id);
    END IF;
END $$;

-- ENABLE ROW LEVEL SECURITY (safe - only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_templates') THEN
        ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_fields') THEN
        ALTER TABLE card_fields ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_completions') THEN
        ALTER TABLE card_completions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='field_completions') THEN
        ALTER TABLE field_completions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formulas') THEN
        ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formula_lookups') THEN
        ALTER TABLE formula_lookups ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formula_lookup_conditions') THEN
        ALTER TABLE formula_lookup_conditions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visual_objects') THEN
        ALTER TABLE visual_objects ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visual_object_images') THEN
        ALTER TABLE visual_object_images ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='leads') THEN
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='email_templates') THEN
        ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='analytics') THEN
        ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- POLICIES (allow all operations for now - admin authentication handled by middleware)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_templates') THEN
        DROP POLICY IF EXISTS "Allow all operations on card_templates" ON card_templates;
        CREATE POLICY "Allow all operations on card_templates" ON card_templates FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_fields') THEN
        DROP POLICY IF EXISTS "Allow all operations on card_fields" ON card_fields;
        CREATE POLICY "Allow all operations on card_fields" ON card_fields FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_completions') THEN
        DROP POLICY IF EXISTS "Allow all operations on card_completions" ON card_completions;
        CREATE POLICY "Allow all operations on card_completions" ON card_completions FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='field_completions') THEN
        DROP POLICY IF EXISTS "Allow all operations on field_completions" ON field_completions;
        CREATE POLICY "Allow all operations on field_completions" ON field_completions FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formulas') THEN
        DROP POLICY IF EXISTS "Allow all operations on formulas" ON formulas;
        CREATE POLICY "Allow all operations on formulas" ON formulas FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formula_lookups') THEN
        DROP POLICY IF EXISTS "Allow all operations on formula_lookups" ON formula_lookups;
        CREATE POLICY "Allow all operations on formula_lookups" ON formula_lookups FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formula_lookup_conditions') THEN
        DROP POLICY IF EXISTS "Allow all operations on formula_lookup_conditions" ON formula_lookup_conditions;
        CREATE POLICY "Allow all operations on formula_lookup_conditions" ON formula_lookup_conditions FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visual_objects') THEN
        DROP POLICY IF EXISTS "Allow all operations on visual_objects" ON visual_objects;
        CREATE POLICY "Allow all operations on visual_objects" ON visual_objects FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visual_object_images') THEN
        DROP POLICY IF EXISTS "Allow all operations on visual_object_images" ON visual_object_images;
        CREATE POLICY "Allow all operations on visual_object_images" ON visual_object_images FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='leads') THEN
        DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
        CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='email_templates') THEN
        DROP POLICY IF EXISTS "Allow all operations on email_templates" ON email_templates;
        CREATE POLICY "Allow all operations on email_templates" ON email_templates FOR ALL USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='analytics') THEN
        DROP POLICY IF EXISTS "Allow all operations on analytics" ON analytics;
        CREATE POLICY "Allow all operations on analytics" ON analytics FOR ALL USING (true);
    END IF;
END $$;

-- UPDATE TRIGGERS (safe - function can be replaced, triggers created only if not exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers safely (only if they don't already exist)
DO $$
BEGIN
    -- card_templates trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_templates') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_card_templates_updated_at') THEN
            CREATE TRIGGER update_card_templates_updated_at BEFORE UPDATE ON card_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- card_fields trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_fields') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_card_fields_updated_at') THEN
            CREATE TRIGGER update_card_fields_updated_at BEFORE UPDATE ON card_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- card_completions trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='card_completions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_card_completions_updated_at') THEN
            CREATE TRIGGER update_card_completions_updated_at BEFORE UPDATE ON card_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- field_completions trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='field_completions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_field_completions_updated_at') THEN
            CREATE TRIGGER update_field_completions_updated_at BEFORE UPDATE ON field_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- formulas trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formulas') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_formulas_updated_at') THEN
            CREATE TRIGGER update_formulas_updated_at BEFORE UPDATE ON formulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- formula_lookups trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='formula_lookups') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_formula_lookups_updated_at') THEN
            CREATE TRIGGER update_formula_lookups_updated_at BEFORE UPDATE ON formula_lookups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- visual_objects trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visual_objects') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_visual_objects_updated_at') THEN
            CREATE TRIGGER update_visual_objects_updated_at BEFORE UPDATE ON visual_objects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- leads trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='leads') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_leads_updated_at') THEN
            CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    -- email_templates trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='email_templates') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name='update_email_templates_updated_at') THEN
            CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;