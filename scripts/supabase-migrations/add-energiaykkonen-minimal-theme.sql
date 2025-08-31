-- Migration: Add Energiaykkonen Minimal Theme
-- Inserts the new minimal theme based on form-card-minimal-style-json specifications

INSERT INTO themes (name, description, theme_data, is_active, is_default) VALUES (
  'Energiaykkonen Minimal',
  'Clean minimalist design with borderless inputs, uppercase labels, and green accent. Features 4px left border and bottom-only input borders.',
  '{
    "id": "energiaykkonen-minimal",
    "name": "Energiaykkonen Minimal",
    "description": "Clean minimalist design with borderless inputs, uppercase labels, and green accent. Features 4px left border and bottom-only input borders.",
    "primaryColor": "#10b981",
    "secondaryColor": "#6b7280",
    "fontFamily": "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    "headingFontFamily": "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    "fieldSettings": {
      "borderRadius": "none",
      "fieldStyle": "underlined",
      "buttonStyle": "solid",
      "buttonRadius": "sm",
      "fieldSpacing": "default"
    },
    "computed": {
      "primaryHover": "#059669",
      "primaryLight": "#34d399",
      "primaryText": "#ffffff",
      "secondaryHover": "#4b5563",
      "secondaryLight": "#9ca3af",
      "secondaryText": "#ffffff"
    },
    "isActive": false,
    "isDefault": false,
    "createdAt": "2024-08-31T14:00:00Z",
    "updatedAt": "2024-08-31T14:00:00Z"
  }'::jsonb,
  false,
  false
) ON CONFLICT DO NOTHING;