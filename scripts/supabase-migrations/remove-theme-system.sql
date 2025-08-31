-- Migration: Remove theme management system
-- This removes all theme-related tables and data

-- Drop theme-related tables
DROP TABLE IF EXISTS card_style_overrides CASCADE;
DROP TABLE IF EXISTS themes CASCADE;

-- Drop theme-related functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;