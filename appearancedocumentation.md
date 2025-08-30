Feature Documentation: Appearance Customization System
System Overview
The appearance customization system operates on two levels: global theme settings that apply to the entire calculator, and card-specific overrides that allow fine-grained control when needed. This hierarchical approach balances simplicity (most users only need to set brand colors and fonts) with flexibility (power users can customize individual cards).
Architecture Components
1. Global Theme Layer
Purpose: Establishes the base visual identity for the entire calculator application.
Core Settings:

Primary Color: Used for main CTAs, active states, and brand emphasis
Secondary Color: Used for supporting elements, success states, and accents
Font Family: Base typography for all text content
Heading Font (optional): Distinct typography for titles and headers

Why These Settings: Research shows that 90% of brand consistency needs are met by controlling colors and typography. These four settings can transform the entire calculator's appearance while maintaining visual coherence.
Storage Strategy: Single active theme record in database. When admins update global settings, changes propagate immediately to all cards that don't have overrides.
2. Card-Level Override System
Purpose: Allows customization of individual cards for special emphasis or unique requirements.
Override Capabilities:

Background color (for highlighting important sections)
Text color (for contrast adjustments)
Accent color (replaces primary color for this card only)
Padding density (compact/default/spacious)
Layout variant (how content is arranged within the card)
Custom CSS (escape hatch for unique requirements)

Override Philosophy: Card overrides are optional and additive. A card with no overrides automatically inherits all global settings. Each override is independently toggleable.
Data Flow Architecture
Inheritance Cascade

Browser defaults (lowest priority)
Global theme settings (applied via CSS custom properties)
Card type defaults (calculation cards might have different padding than form cards)
Individual card overrides (highest priority)

This cascade ensures predictable styling while maintaining flexibility. CSS custom properties enable runtime theme switching without rebuilds.
Real-time Updates
When global theme changes:

System updates CSS variables at document root
All cards without overrides immediately reflect changes
Cards with overrides maintain their custom settings
Preview system shows changes instantly

When card override changes:

Only that specific card updates
Override flag is set to prevent global theme from overwriting
Admin can toggle between override and inherited state

User Workflows
Admin Global Configuration
Entry Point: Admin → Appearance Settings
Workflow:

Admin accesses appearance settings page
Color pickers show current theme colors with real-time preview
Font selector offers curated list of web-safe fonts plus custom font URL option
"Apply to All" button updates global theme
"Reset Card Overrides" option available to remove all customizations

Validation: System prevents illegible combinations (e.g., white text on white background) through contrast checking.
Card-Specific Customization
Entry Point: Card Builder → Individual Card → Appearance Tab
Workflow:

Admin edits any card in card builder
Appearance tab shows inherited values in gray, custom values in black
"Override Global Theme" toggle activates customization panel
Each setting has "inherit" checkbox to selectively use global values
Preview pane shows card with current settings
"Copy Style" and "Paste Style" enables reusing customizations

Smart Defaults: When override is activated, current computed styles are copied as starting point, preventing jarring changes.
Technical Implementation Requirements
CSS Architecture
CSS Custom Properties Strategy:

Define properties at :root for global theme
Override properties at .card[data-card-id] level for customizations
Use semantic naming: --card-bg, --card-text, not --color-1

Responsive Considerations:

Padding scales with viewport
Font sizes use fluid typography
Color contrast maintains WCAG AA compliance

Database Design
Theme Settings Table:

Single source of truth for active theme
Versioning support for theme history
JSON column for extensibility without schema changes

Card Style Config:

JSONB column on cards table
Null values inherit from global
Explicit values override global
Flag distinguishes intentional overrides from defaults

Performance Optimization
CSS Variable Benefits:

No JavaScript re-rendering for theme changes
Browser-native cascade handling
Instant updates without React reconciliation

Lazy Loading Strategy:

Global theme loads with initial page
Card overrides load with card data
Custom fonts load asynchronously with fallbacks

State Management
Global Theme State
Location: React Context at app root
Updates: Through Supabase real-time subscriptions
Caching: LocalStorage for offline resilience
Card Override State
Location: Within individual card components
Updates: Merged with card data on fetch
Persistence: Saved with card configuration
Migration Strategy
Phase 1: Global Theme

Implement theme settings database table
Add CSS custom property system
Create admin UI for global settings
Migrate existing hardcoded colors to theme

Phase 2: Card Overrides

Add style_config column to cards table
Extend card builder with appearance tab
Implement override UI components
Add preview capabilities

Phase 3: Advanced Features

Theme presets (pre-configured color schemes)
Dark mode support
Custom CSS validation
A/B testing different themes

Security Considerations
CSS Injection Prevention:

Sanitize custom CSS input
Whitelist allowed CSS properties
Escape user-provided values
Content Security Policy headers

Font Loading:

Validate font URLs
Implement CORS policies
Fallback for failed font loads

Accessibility Requirements
Contrast Validation:

Automatic WCAG AA checking
Warning for poor contrast combinations
Suggested accessible alternatives

Font Sizing:

Minimum font size enforcement
Relative units for user scaling
Dyslexia-friendly font options

Future Extensibility
The system architecture supports future additions:

Component-specific themes (all buttons, all inputs)
Seasonal theme switching
Client-specific theme libraries
Export/import theme configurations
Visual theme builder with drag-and-drop

This two-tier approach (global + overrides) provides the optimal balance between simplicity for basic branding needs and power for advanced customization requirements.