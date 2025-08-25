-- Create visual_assets table to store image and media files
CREATE TABLE IF NOT EXISTS visual_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf')),
  category VARCHAR(100) NOT NULL CHECK (category IN ('icons', 'charts', 'forms', 'backgrounds', 'logos', 'other')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  tags TEXT[] DEFAULT '{}',
  used_in TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visual_assets_name ON visual_assets(name);
CREATE INDEX IF NOT EXISTS idx_visual_assets_category ON visual_assets(category);
CREATE INDEX IF NOT EXISTS idx_visual_assets_type ON visual_assets(type);
CREATE INDEX IF NOT EXISTS idx_visual_assets_active ON visual_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_visual_assets_tags ON visual_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_visual_assets_used_in ON visual_assets USING GIN(used_in);

-- Enable Row Level Security
ALTER TABLE visual_assets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all assets
CREATE POLICY "Users can read all visual assets" ON visual_assets
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own assets
CREATE POLICY "Users can insert their own visual assets" ON visual_assets
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create policy to allow authenticated users to update their own assets
CREATE POLICY "Users can update their own visual assets" ON visual_assets
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policy to allow authenticated users to delete their own assets
CREATE POLICY "Users can delete their own visual assets" ON visual_assets
  FOR DELETE USING (auth.uid() = created_by);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_visual_assets_updated_at
  BEFORE UPDATE ON visual_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
