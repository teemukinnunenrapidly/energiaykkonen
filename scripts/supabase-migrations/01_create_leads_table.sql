-- Create leads table according to PRD specifications
-- This migration creates the leads table with all required fields for the Heat Pump Calculator

CREATE TABLE IF NOT EXISTS leads (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Form inputs: House Information (Step 1)
  square_meters INTEGER NOT NULL CHECK (square_meters >= 10 AND square_meters <= 1000),
  ceiling_height DECIMAL(3,1) NOT NULL CHECK (ceiling_height IN (2.5, 3.0, 3.5)),
  construction_year VARCHAR(20) NOT NULL CHECK (construction_year IN ('<1970', '1970-1990', '1991-2010', '>2010')),
  floors INTEGER NOT NULL CHECK (floors >= 1 AND floors <= 10),
  
  -- Form inputs: Current Heating (Step 2)
  heating_type VARCHAR(50) NOT NULL CHECK (heating_type IN ('Oil', 'Electric', 'District', 'Other')),
  current_heating_cost DECIMAL(10,2) NOT NULL CHECK (current_heating_cost > 0),
  current_energy_consumption DECIMAL(10,2), -- Optional field
  
  -- Form inputs: Household (Step 3)
  residents INTEGER NOT NULL CHECK (residents >= 1 AND residents <= 10),
  hot_water_usage VARCHAR(20) NOT NULL CHECK (hot_water_usage IN ('Low', 'Normal', 'High')),
  
  -- Contact info (Step 4)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  street_address TEXT,
  city VARCHAR(100),
  contact_preference VARCHAR(20) NOT NULL CHECK (contact_preference IN ('Email', 'Phone', 'Both')),
  message TEXT,
  
  -- Calculated values (from calculator)
  annual_energy_need DECIMAL(12,2) NOT NULL,
  heat_pump_consumption DECIMAL(12,2) NOT NULL,
  heat_pump_cost_annual DECIMAL(10,2) NOT NULL,
  annual_savings DECIMAL(10,2) NOT NULL,
  five_year_savings DECIMAL(12,2) NOT NULL,
  ten_year_savings DECIMAL(12,2) NOT NULL,
  payback_period DECIMAL(5,2) NOT NULL,
  co2_reduction DECIMAL(10,2) NOT NULL,
  
  -- Lead management
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  source_page VARCHAR(255)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_annual_savings ON leads(annual_savings DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE leads IS 'Stores lead information from the Heat Pump Calculator form including calculations and contact details';
COMMENT ON COLUMN leads.square_meters IS 'House size in square meters (10-1000)';
COMMENT ON COLUMN leads.ceiling_height IS 'Ceiling height in meters (2.5, 3.0, or 3.5)';
COMMENT ON COLUMN leads.construction_year IS 'Construction year range';
COMMENT ON COLUMN leads.floors IS 'Number of floors in the house';
COMMENT ON COLUMN leads.heating_type IS 'Current heating type (Oil, Electric, District, Other)';
COMMENT ON COLUMN leads.current_heating_cost IS 'Current annual heating cost in euros';
COMMENT ON COLUMN leads.current_energy_consumption IS 'Optional: Current energy consumption in kWh/year';
COMMENT ON COLUMN leads.residents IS 'Number of residents (1-10)';
COMMENT ON COLUMN leads.hot_water_usage IS 'Hot water usage level (Low, Normal, High)';
COMMENT ON COLUMN leads.contact_preference IS 'Preferred contact method (Email, Phone, Both)';
COMMENT ON COLUMN leads.annual_energy_need IS 'Calculated annual energy need in kWh';
COMMENT ON COLUMN leads.heat_pump_consumption IS 'Calculated heat pump energy consumption in kWh';
COMMENT ON COLUMN leads.heat_pump_cost_annual IS 'Calculated annual cost with heat pump in euros';
COMMENT ON COLUMN leads.annual_savings IS 'Calculated annual savings in euros';
COMMENT ON COLUMN leads.five_year_savings IS 'Calculated 5-year total savings in euros';
COMMENT ON COLUMN leads.ten_year_savings IS 'Calculated 10-year total savings in euros';
COMMENT ON COLUMN leads.payback_period IS 'Calculated payback period in years';
COMMENT ON COLUMN leads.co2_reduction IS 'Calculated CO2 reduction in kg per year';
COMMENT ON COLUMN leads.status IS 'Lead status for sales pipeline tracking';
COMMENT ON COLUMN leads.ip_address IS 'IP address of the form submission for analytics';
COMMENT ON COLUMN leads.user_agent IS 'User agent string for device/browser analytics';
COMMENT ON COLUMN leads.source_page IS 'Source page URL where the calculator was embedded';
