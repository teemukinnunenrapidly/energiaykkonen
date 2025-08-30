// Theme system types for appearance customization
// Based on architecture: 4 core global settings + card-specific overrides

// Core Global Theme Settings (the essential 4 + field settings)
export interface GlobalThemeCore {
  // Primary Color: Used for main CTAs, active states, and brand emphasis
  primaryColor: string;
  
  // Secondary Color: Used for supporting elements, success states, and accents  
  secondaryColor: string;
  
  // Font Family: Base typography for all text content
  fontFamily: string;
  
  // Heading Font (optional): Distinct typography for titles and headers
  headingFontFamily?: string;
  
  // Global Field Settings
  fieldSettings: {
    // Border radius for all input fields
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    
    // Input field style
    fieldStyle: 'outlined' | 'filled' | 'underlined';
    
    // Button style
    buttonStyle: 'solid' | 'outlined' | 'ghost';
    
    // Button corner style
    buttonRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    
    // Field spacing
    fieldSpacing: 'compact' | 'default' | 'spacious';
  };
}

// Extended theme with computed values (derived from core settings)
export interface GlobalTheme extends GlobalThemeCore {
  id: string;
  name: string;
  description?: string;
  
  // Computed colors (auto-generated from primary/secondary)
  computed: {
    primaryHover: string;    // Darker shade of primary
    primaryLight: string;    // Lighter shade of primary  
    primaryText: string;     // White or black based on primary contrast
    secondaryHover: string;  // Darker shade of secondary
    secondaryLight: string;  // Lighter shade of secondary
    secondaryText: string;   // White or black based on secondary contrast
  };
  
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Card-specific style overrides (optional and additive)
export interface CardStyleOverride {
  cardId: string;
  
  // Background color (for highlighting important sections)
  backgroundColor?: string;
  
  // Text color (for contrast adjustments)  
  textColor?: string;
  
  // Accent color (replaces primary color for this card only)
  accentColor?: string;
  
  // Padding density (compact/default/spacious)
  paddingDensity?: 'compact' | 'default' | 'spacious';
  
  // Layout variant (how content is arranged within the card)
  layoutVariant?: 'default' | 'centered' | 'split' | 'wide';
  
  // Custom CSS (escape hatch for unique requirements)
  customCss?: string;
}

// Theme preset for quick setup
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'minimal' | 'colorful' | 'dark' | 'custom';
  preview: string; // URL to preview image
  theme: GlobalThemeCore;
}

// Padding density mappings
export const PADDING_DENSITY_MAP = {
  compact: {
    card: 'p-4',
    field: 'p-2',
    button: 'px-3 py-1.5',
  },
  default: {
    card: 'p-6',
    field: 'p-3',
    button: 'px-4 py-2',
  },
  spacious: {
    card: 'p-8',
    field: 'p-4',
    button: 'px-6 py-3',
  },
} as const;

// Border radius mappings
export const BORDER_RADIUS_MAP = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

// Database interfaces (matches Supabase schema)
export interface ThemeRecord {
  id: string;
  name: string;
  description?: string;
  theme_data: GlobalTheme;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardStyleOverrideRecord {
  id: string;
  card_id: string;
  theme_id: string;
  style_overrides: CardStyleOverride;
  created_at: string;
  updated_at: string;
}

// Default theme core settings
export const DEFAULT_THEME_CORE: GlobalThemeCore = {
  primaryColor: '#3b82f6',
  secondaryColor: '#22c55e', 
  fontFamily: 'Inter, system-ui, sans-serif',
  headingFontFamily: 'Inter, system-ui, sans-serif',
  fieldSettings: {
    borderRadius: 'md',
    fieldStyle: 'outlined',
    buttonStyle: 'solid',
    buttonRadius: 'md',
    fieldSpacing: 'default',
  },
};

// Utility functions for color computation
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastColor(hex: string): string {
  const luminance = getLuminance(hex);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const { r, g, b } = rgb;
  const factor = 1 - (percent / 100);
  
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);  
  const newB = Math.round(b * factor);
  
  return `#${[newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const { r, g, b } = rgb;
  const factor = percent / 100;
  
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);
  
  return `#${[newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

// Compute derived colors from core theme
export function computeThemeColors(core: GlobalThemeCore): GlobalTheme['computed'] {
  return {
    primaryHover: darkenColor(core.primaryColor, 15),
    primaryLight: lightenColor(core.primaryColor, 20),
    primaryText: getContrastColor(core.primaryColor),
    secondaryHover: darkenColor(core.secondaryColor, 15), 
    secondaryLight: lightenColor(core.secondaryColor, 20),
    secondaryText: getContrastColor(core.secondaryColor),
  };
}