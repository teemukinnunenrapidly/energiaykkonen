-- Create email_templates table to store email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('results', 'sales-notification', 'welcome', 'follow-up', 'other')),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_version ON email_templates(version);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all templates
CREATE POLICY "Users can read all email templates" ON email_templates
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own templates
CREATE POLICY "Users can insert their own email templates" ON email_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create policy to allow authenticated users to update their own templates
CREATE POLICY "Users can update their own email templates" ON email_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policy to allow authenticated users to delete their own templates
CREATE POLICY "Users can delete their own email templates" ON email_templates
  FOR DELETE USING (auth.uid() = created_by);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



