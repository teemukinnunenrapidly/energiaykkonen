-- Migration: Create Card System
-- Date: 2024-12-19
-- Description: Creates the complete card system for dynamic content management

-- Card Categories table
CREATE TABLE IF NOT EXISTS card_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  icon VARCHAR(100), -- Icon identifier (e.g., 'home', 'calculator', 'chart')
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  category_id UUID REFERENCES card_categories(id) ON DELETE SET NULL,
  card_type VARCHAR(50) DEFAULT 'info', -- 'info', 'action', 'stat', 'chart', 'form'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  priority INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  target_audience VARCHAR(100)[], -- Array of audience types
  tags VARCHAR(100)[], -- Array of tags
  metadata JSONB, -- Flexible metadata storage
  created_by UUID, -- Could reference auth.users if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card Streams table (for organizing cards into streams)
CREATE TABLE IF NOT EXISTS card_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card Stream Items (many-to-many relationship between cards and streams)
CREATE TABLE IF NOT EXISTS card_stream_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES card_streams(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Order within the stream
  is_visible BOOLEAN DEFAULT true,
  display_duration INTEGER DEFAULT 0, -- Seconds to display (0 = indefinite)
  start_condition JSONB, -- Conditional display logic
  end_condition JSONB, -- Conditional end logic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stream_id, position)
);

-- Card Interactions table (for tracking user engagement)
CREATE TABLE IF NOT EXISTS card_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- Could be UUID if referencing auth.users
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'dismiss', 'complete'
  interaction_data JSONB, -- Additional interaction details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card Templates table (for reusable card structures)
CREATE TABLE IF NOT EXISTS card_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Template structure and default values
  category_id UUID REFERENCES card_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to document the tables
COMMENT ON TABLE card_categories IS 'Categories for organizing cards (e.g., Energy Tips, Calculators, News)';
COMMENT ON TABLE cards IS 'Individual content cards with various types and metadata';
COMMENT ON TABLE card_streams IS 'Named streams for organizing and displaying cards';
COMMENT ON TABLE card_stream_items IS 'Many-to-many relationship between cards and streams with positioning';
COMMENT ON TABLE card_interactions IS 'User interaction tracking for analytics and personalization';
COMMENT ON TABLE card_templates IS 'Reusable templates for creating consistent card structures';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_category_id ON cards(category_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_priority ON cards(priority);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(card_type);
CREATE INDEX IF NOT EXISTS idx_cards_featured ON cards(is_featured);
CREATE INDEX IF NOT EXISTS idx_cards_date_range ON cards(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_card_streams_slug ON card_streams(slug);
CREATE INDEX IF NOT EXISTS idx_card_streams_active ON card_streams(is_active);

CREATE INDEX IF NOT EXISTS idx_card_stream_items_stream_position ON card_stream_items(stream_id, position);
CREATE INDEX IF NOT EXISTS idx_card_stream_items_card ON card_stream_items(card_id);
CREATE INDEX IF NOT EXISTS idx_card_stream_items_visible ON card_stream_items(is_visible);

CREATE INDEX IF NOT EXISTS idx_card_interactions_card ON card_interactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_interactions_type ON card_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_card_interactions_created ON card_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_card_templates_category ON card_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_card_templates_active ON card_templates(is_active);

-- Insert default card categories
INSERT INTO card_categories (id, name, description, color, icon, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Energy Tips', 'Helpful tips for energy efficiency', '#10B981', 'lightbulb', 1),
  ('00000000-0000-0000-0000-000000000002', 'Calculators', 'Energy calculation tools and forms', '#3B82F6', 'calculator', 2),
  ('00000000-0000-0000-0000-000000000003', 'News & Updates', 'Latest energy industry news', '#F59E0B', 'newspaper', 3),
  ('00000000-0000-0000-0000-000000000004', 'Educational', 'Learning resources and guides', '#8B5CF6', 'book-open', 4),
  ('00000000-0000-0000-0000-000000000005', 'Promotions', 'Special offers and deals', '#EF4444', 'gift', 5)
ON CONFLICT DO NOTHING;

-- Insert default card stream
INSERT INTO card_streams (id, name, description, slug, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Main Dashboard', 'Primary card stream for the main dashboard', 'main-dashboard', 1)
ON CONFLICT DO NOTHING;

-- Insert sample cards
INSERT INTO cards (id, title, subtitle, content, category_id, card_type, status, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Welcome to Energy Calculator', 'Get started with energy savings', 'Use our calculator to estimate your energy savings potential. Enter your property details and get personalized recommendations.', '00000000-0000-0000-0000-000000000002', 'action', 'published', 1),
  ('00000000-0000-0000-0000-000000000002', 'Energy Saving Tip', 'Reduce your heating costs', 'Lower your thermostat by just 1°C and save up to 10% on your heating bill. Every degree counts!', '00000000-0000-0000-0000-000000000001', 'info', 'published', 2),
  ('00000000-0000-0000-0000-000000000003', 'Latest Energy News', 'Renewable energy growth', 'Renewable energy sources now account for over 30% of global electricity generation, marking a significant milestone in the energy transition.', '00000000-0000-0000-0000-000000000003', 'info', 'published', 3)
ON CONFLICT DO NOTHING;

-- Insert sample card stream items
INSERT INTO card_stream_items (stream_id, card_id, position) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 2),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 3)
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
CREATE TRIGGER update_card_categories_updated_at 
    BEFORE UPDATE ON card_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_streams_updated_at 
    BEFORE UPDATE ON card_streams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_templates_updated_at 
    BEFORE UPDATE ON card_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get cards for a specific stream with proper ordering
CREATE OR REPLACE FUNCTION get_stream_cards(stream_slug VARCHAR)
RETURNS TABLE (
    card_id UUID,
    title VARCHAR(255),
    subtitle TEXT,
    content TEXT,
    card_type VARCHAR(50),
    category_name VARCHAR(255),
    category_color VARCHAR(7),
    category_icon VARCHAR(100),
    position INTEGER,
    is_visible BOOLEAN,
    display_duration INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as card_id,
        c.title,
        c.subtitle,
        c.content,
        c.card_type,
        cc.name as category_name,
        cc.color as category_color,
        cc.icon as category_icon,
        csi.position,
        csi.is_visible,
        csi.display_duration
    FROM card_stream_items csi
    JOIN card_streams cs ON csi.stream_id = cs.id
    JOIN cards c ON csi.card_id = c.id
    LEFT JOIN card_categories cc ON c.category_id = cc.id
    WHERE cs.slug = stream_slug 
        AND cs.is_active = true 
        AND c.status = 'published'
        AND csi.is_visible = true
    ORDER BY csi.position ASC;
END;
$$ LANGUAGE plpgsql;
