'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GlobalTheme,
  GlobalThemeCore,
  CardStyleOverride,
  DEFAULT_THEME_CORE,
  computeThemeColors,
} from '@/lib/types/theme';
import { getActiveTheme, getCardOverrides } from '@/lib/theme-service';

interface ThemeContextType {
  // Current theme
  theme: GlobalTheme;

  // Card overrides
  cardOverrides: Record<string, CardStyleOverride>;

  // Theme management
  updateTheme: (themeCore: GlobalThemeCore) => void;
  setCardOverride: (
    cardId: string,
    override: Partial<CardStyleOverride>
  ) => void;
  removeCardOverride: (cardId: string) => void;

  // Utility functions
  getCardStyles: (cardId: string) => React.CSSProperties;
  getEffectiveTheme: (cardId?: string) => {
    colors: {
      primary: string;
      secondary: string;
      text: string;
    };
    fonts: {
      body: string;
      heading: string;
    };
    spacing: string;
    borderRadius: string;
  };
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: GlobalThemeCore;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [themeCore, setThemeCore] = useState<GlobalThemeCore>(
    initialTheme || DEFAULT_THEME_CORE
  );
  const [cardOverrides, setCardOverrides] = useState<
    Record<string, CardStyleOverride>
  >({});

  // Load active theme from database on mount
  useEffect(() => {
    const loadActiveTheme = async () => {
      try {
        const activeTheme = await getActiveTheme();
        if (activeTheme) {
          setThemeCore({
            primaryColor: activeTheme.primaryColor,
            secondaryColor: activeTheme.secondaryColor,
            fontFamily: activeTheme.fontFamily,
            headingFontFamily: activeTheme.headingFontFamily,
            fieldSettings: activeTheme.fieldSettings,
          });
        }

        // Load card overrides
        const overrides = await getCardOverrides(activeTheme?.id);
        setCardOverrides(overrides);
      } catch (error) {
        console.error('Failed to load active theme:', error);
        // Keep using default theme on error
      }
    };

    // Only load from database if no initial theme was provided
    if (!initialTheme) {
      loadActiveTheme();
    }
  }, [initialTheme]);

  // Compute full theme from core settings
  const theme: GlobalTheme = {
    ...themeCore,
    id: 'current',
    name: 'Current Theme',
    computed: computeThemeColors(themeCore),
    isActive: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const computed = theme.computed;

    // Set CSS custom properties for global theme
    root.style.setProperty('--theme-primary', theme.primaryColor);
    root.style.setProperty('--theme-primary-hover', computed.primaryHover);
    root.style.setProperty('--theme-primary-light', computed.primaryLight);
    root.style.setProperty('--theme-primary-text', computed.primaryText);

    root.style.setProperty('--theme-secondary', theme.secondaryColor);
    root.style.setProperty('--theme-secondary-hover', computed.secondaryHover);
    root.style.setProperty('--theme-secondary-light', computed.secondaryLight);
    root.style.setProperty('--theme-secondary-text', computed.secondaryText);

    root.style.setProperty('--theme-font-body', theme.fontFamily);
    root.style.setProperty(
      '--theme-font-heading',
      theme.headingFontFamily || theme.fontFamily
    );
  }, [theme]);

  const updateTheme = (newThemeCore: GlobalThemeCore) => {
    setThemeCore(newThemeCore);
  };

  const setCardOverride = (
    cardId: string,
    override: Partial<CardStyleOverride>
  ) => {
    setCardOverrides(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        cardId,
        ...override,
      },
    }));
  };

  const removeCardOverride = (cardId: string) => {
    setCardOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[cardId];
      return newOverrides;
    });
  };

  const getCardStyles = (cardId: string): React.CSSProperties => {
    const override = cardOverrides[cardId];
    if (!override) {
      return {};
    }

    const styles: React.CSSProperties = {};

    if (override.backgroundColor) {
      styles.backgroundColor = override.backgroundColor;
    }
    if (override.textColor) {
      styles.color = override.textColor;
    }
    if (override.accentColor) {
      (styles as any)['--card-accent-color'] = override.accentColor;
    }

    return styles;
  };

  const getEffectiveTheme = (cardId?: string) => {
    const override = cardId ? cardOverrides[cardId] : null;

    return {
      colors: {
        primary: override?.accentColor || theme.primaryColor,
        secondary: theme.secondaryColor,
        text: override?.textColor || '#0f172a',
      },
      fonts: {
        body: theme.fontFamily,
        heading: theme.headingFontFamily || theme.fontFamily,
      },
      spacing: override?.paddingDensity || theme.fieldSettings.fieldSpacing,
      borderRadius: theme.fieldSettings.borderRadius,
    };
  };

  const contextValue: ThemeContextType = {
    theme,
    cardOverrides,
    updateTheme,
    setCardOverride,
    removeCardOverride,
    getCardStyles,
    getEffectiveTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for getting theme-aware CSS classes
export function useThemeClasses() {
  const {
    theme: currentTheme,
    cardOverrides: currentCardOverrides,
    getEffectiveTheme,
  } = useTheme();

  return {
    // Button classes based on theme
    getButtonClasses: (
      variant: 'primary' | 'secondary' | 'outline' = 'primary',
      cardId?: string
    ) => {
      const effective = getEffectiveTheme(cardId);
      const radiusClass = `rounded-${currentTheme.fieldSettings.buttonRadius}`;
      const spacingClass =
        effective.spacing === 'compact'
          ? 'px-3 py-1.5'
          : effective.spacing === 'spacious'
            ? 'px-6 py-3'
            : 'px-4 py-2';

      const baseClasses = `${radiusClass} ${spacingClass} font-medium transition-colors`;

      if (currentTheme.fieldSettings.buttonStyle === 'solid') {
        if (variant === 'primary') {
          return `${baseClasses} text-white hover:opacity-90`;
        } else {
          return `${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-200`;
        }
      } else if (currentTheme.fieldSettings.buttonStyle === 'outlined') {
        return `${baseClasses} border-2 bg-transparent hover:bg-opacity-10`;
      } else {
        // ghost
        return `${baseClasses} bg-transparent hover:bg-opacity-10`;
      }
    },

    // Field classes based on theme
    getFieldClasses: (cardId?: string) => {
      const effective = getEffectiveTheme(cardId);
      const radiusClass = `rounded-${currentTheme.fieldSettings.borderRadius}`;
      const spacingClass =
        effective.spacing === 'compact'
          ? 'p-2'
          : effective.spacing === 'spacious'
            ? 'p-4'
            : 'p-3';

      if (currentTheme.fieldSettings.fieldStyle === 'filled') {
        return `${radiusClass} ${spacingClass} bg-gray-50 border-0 focus:bg-white focus:ring-2`;
      } else if (currentTheme.fieldSettings.fieldStyle === 'underlined') {
        return `${spacingClass} bg-transparent border-0 border-b-2 border-gray-200 rounded-none focus:border-current focus:ring-0`;
      } else {
        // outlined
        return `${radiusClass} ${spacingClass} bg-white border border-gray-200 focus:border-current focus:ring-1`;
      }
    },

    // Card classes based on theme and overrides
    getCardClasses: (cardId: string) => {
      const override = currentCardOverrides[cardId];
      const spacing = override?.paddingDensity || 'default';

      const spacingClass =
        spacing === 'compact' ? 'p-4' : spacing === 'spacious' ? 'p-8' : 'p-6';

      return `bg-white rounded-lg shadow-lg border ${spacingClass}`;
    },
  };
}
