export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  locked: boolean;
  isDefault: boolean;
  isActive: boolean;
  config: ThemeConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ThemeConfig {
  colors: ColorSettings;
  typography: TypographySettings;
  layout: LayoutSettings;
  components: ComponentSettings;
  metadata: ThemeMetadata;
}

export interface ColorSettings {
  // Brand Colors
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  
  // UI Colors
  background: BackgroundColors;
  surface: SurfaceColors;
  
  // Text Colors
  text: TextColors;
  
  // Semantic Colors
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
  
  // Component Specific
  divider: string;
  border: string;
  shadow: string;
  focus: string;
  hover: string;
  selected: string;
}

export interface ColorPalette {
  main: string;
  light: string;
  dark: string;
  contrast: string;
}

export interface BackgroundColors {
  default: string;
  paper: string;
  elevated: string;
  overlay: string;
}

export interface SurfaceColors {
  default: string;
  hover: string;
  active: string;
  disabled: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  disabled: string;
  hint: string;
  inverse: string;
}

export interface TypographySettings {
  fontFamily: FontFamilySettings;
  fontSize: FontSizeSettings;
  fontWeight: FontWeightSettings;
  lineHeight: LineHeightSettings;
  letterSpacing: LetterSpacingSettings;
}

export interface FontFamilySettings {
  primary: string;
  secondary: string;
  monospace: string;
  customUrl?: string;
}

export interface FontSizeSettings {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

export interface FontWeightSettings {
  thin: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
}

export interface LineHeightSettings {
  none: number;
  tight: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface LetterSpacingSettings {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

export interface LayoutSettings {
  container: ContainerSettings;
  spacing: SpacingSettings;
  borderRadius: BorderRadiusSettings;
  shadows: ShadowSettings;
  transitions: TransitionSettings;
}

export interface ContainerSettings {
  maxWidth: string;
  padding: string;
  centered: boolean;
}

export interface SpacingSettings {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface BorderRadiusSettings {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface ShadowSettings {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface TransitionSettings {
  duration: TransitionDuration;
  easing: TransitionEasing;
}

export interface TransitionDuration {
  fast: string;
  normal: string;
  slow: string;
}

export interface TransitionEasing {
  linear: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
}

export interface ComponentSettings {
  button: ButtonSettings;
  input: InputSettings;
  card: CardSettings;
  progress: ProgressSettings;
  section: SectionSettings;
}

export interface ButtonSettings {
  borderRadius: string;
  padding: string;
  fontSize: string;
  fontWeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: string;
  shadow: string;
  transition: string;
  variants: ButtonVariants;
}

export interface ButtonVariants {
  primary: ButtonVariant;
  secondary: ButtonVariant;
  outline: ButtonVariant;
  ghost: ButtonVariant;
}

export interface ButtonVariant {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  hoverBackgroundColor: string;
  hoverTextColor: string;
  hoverBorderColor: string;
}

export interface InputSettings {
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  padding: string;
  fontSize: string;
  height: string;
  focusRing: boolean;
  focusColor: string;
  errorColor: string;
  backgroundColor: string;
}

export interface CardSettings {
  borderRadius: string;
  padding: string;
  shadow: string;
  borderWidth: string;
  borderColor: string;
  backgroundColor: string;
}

export interface ProgressSettings {
  height: string;
  borderRadius: string;
  backgroundColor: string;
  fillColor: string;
  stripedAnimation: boolean;
}

export interface SectionSettings {
  spacing: string;
  dividerStyle: 'none' | 'line' | 'shadow';
  completedOpacity: number;
  lockedBlur: string;
}

export interface ThemeMetadata {
  version: string;
  tags: string[];
  description: string;
  author?: string;
  license?: string;
}

// Default theme configuration
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {
    primary: {
      main: '#FF6B00',
      light: '#FF8533',
      dark: '#CC5500',
      contrast: '#FFFFFF'
    },
    secondary: {
      main: '#1F2937',
      light: '#374151',
      dark: '#111827',
      contrast: '#FFFFFF'
    },
    accent: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      contrast: '#FFFFFF'
    },
    background: {
      default: '#FFFFFF',
      paper: '#F9FAFB',
      elevated: '#FFFFFF',
      overlay: 'rgba(0,0,0,0.5)'
    },
    surface: {
      default: '#FFFFFF',
      hover: '#F3F4F6',
      active: '#E5E7EB',
      disabled: '#F9FAFB'
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
      hint: '#D1D5DB',
      inverse: '#FFFFFF'
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      contrast: '#FFFFFF'
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      contrast: '#FFFFFF'
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      contrast: '#FFFFFF'
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      contrast: '#FFFFFF'
    },
    divider: '#E5E7EB',
    border: '#D1D5DB',
    shadow: 'rgba(0,0,0,0.1)',
    focus: '#3B82F6',
    hover: '#F3F4F6',
    selected: '#DBEAFE'
  },
  typography: {
    fontFamily: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Georgia, serif',
      monospace: 'Fira Code, monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },
  layout: {
    container: {
      maxWidth: '1200px',
      padding: '20px',
      centered: true
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px'
    },
    borderRadius: {
      none: '0',
      sm: '2px',
      md: '4px',
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      '3xl': '24px',
      full: '9999px'
    },
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    },
    transitions: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms'
      },
      easing: {
        linear: 'linear',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out'
      }
    }
  },
  components: {
    button: {
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease-in-out',
      variants: {
        primary: {
          backgroundColor: '#FF6B00',
          textColor: '#FFFFFF',
          borderColor: '#FF6B00',
          hoverBackgroundColor: '#CC5500',
          hoverTextColor: '#FFFFFF',
          hoverBorderColor: '#CC5500'
        },
        secondary: {
          backgroundColor: '#1F2937',
          textColor: '#FFFFFF',
          borderColor: '#1F2937',
          hoverBackgroundColor: '#111827',
          hoverTextColor: '#FFFFFF',
          hoverBorderColor: '#111827'
        },
        outline: {
          backgroundColor: 'transparent',
          textColor: '#FF6B00',
          borderColor: '#FF6B00',
          hoverBackgroundColor: '#FF6B00',
          hoverTextColor: '#FFFFFF',
          hoverBorderColor: '#FF6B00'
        },
        ghost: {
          backgroundColor: 'transparent',
          textColor: '#6B7280',
          borderColor: 'transparent',
          hoverBackgroundColor: '#F3F4F6',
          hoverTextColor: '#374151',
          hoverBorderColor: 'transparent'
        }
      }
    },
    input: {
      borderRadius: '6px',
      borderWidth: '1px',
      borderColor: '#D1D5DB',
      padding: '12px',
      fontSize: '14px',
      height: '44px',
      focusRing: true,
      focusColor: '#3B82F6',
      errorColor: '#EF4444',
      backgroundColor: '#FFFFFF'
    },
    card: {
      borderRadius: '8px',
      padding: '24px',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      borderWidth: '1px',
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF'
    },
    progress: {
      height: '8px',
      borderRadius: '4px',
      backgroundColor: '#E5E7EB',
      fillColor: '#10B981',
      stripedAnimation: false
    },
    section: {
      spacing: '32px',
      dividerStyle: 'line',
      completedOpacity: 0.7,
      lockedBlur: '2px'
    }
  },
  metadata: {
    version: '1.0.0',
    tags: ['default', 'energia-ykkonen'],
    description: 'Default Energia Ykkönen theme with orange primary colors and modern design',
    author: 'E1 Calculator Team',
    license: 'MIT'
  }
};

// Default theme presets
export const DEFAULT_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Energia Ykkönen Default',
    description: 'Default theme with orange primary colors and modern design',
    thumbnail: '/presets/default.png',
    locked: true,
    isDefault: true,
    isActive: true,
    config: DEFAULT_THEME_CONFIG,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  },
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Professional blue theme for corporate clients',
    thumbnail: '/presets/modern-blue.png',
    locked: false,
    isDefault: false,
    isActive: false,
    config: {
      ...DEFAULT_THEME_CONFIG,
      colors: {
        ...DEFAULT_THEME_CONFIG.colors,
        primary: {
          main: '#2563EB',
          light: '#3B82F6',
          dark: '#1D4ED8',
          contrast: '#FFFFFF'
        }
      },
      metadata: {
        ...DEFAULT_THEME_CONFIG.metadata,
        version: '1.0.0',
        tags: ['blue', 'corporate', 'professional'],
        description: 'Modern blue theme for professional applications'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  },
  {
    id: 'eco-green',
    name: 'Eco Green',
    description: 'Environmentally conscious green theme',
    thumbnail: '/presets/eco-green.png',
    locked: false,
    isDefault: false,
    isActive: false,
    config: {
      ...DEFAULT_THEME_CONFIG,
      colors: {
        ...DEFAULT_THEME_CONFIG.colors,
        primary: {
          main: '#10B981',
          light: '#34D399',
          dark: '#059669',
          contrast: '#FFFFFF'
        }
      },
      metadata: {
        ...DEFAULT_THEME_CONFIG.metadata,
        version: '1.0.0',
        tags: ['green', 'eco', 'sustainable'],
        description: 'Eco-friendly green theme for sustainable energy applications'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  }
];
