/**
 * CardStream Theme Applier
 * Dynamically applies styles from cardstream-complete-config.json to CSS variables
 * Can be used both server-side and client-side
 */

import {
  cardStreamConfig,
  type CardStreamConfig,
} from '@/config/cardstream-config';

/**
 * Apply theme styles by setting CSS custom properties on document root
 * This function can be called client-side to dynamically update the theme
 */
export const applyCardStreamTheme = (
  customConfig?: Partial<CardStreamConfig>
): void => {
  // Check if we're in browser environment first
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Use provided config or default
  const themeConfig = customConfig || cardStreamConfig;

  // Safety checks
  if (
    !themeConfig.container ||
    !themeConfig.layout ||
    !themeConfig.colors ||
    !themeConfig.visualSupport ||
    !themeConfig.cardStream ||
    !themeConfig.card ||
    !themeConfig.formElements ||
    !themeConfig.typography ||
    !themeConfig.animations ||
    !themeConfig.calculationCard ||
    !themeConfig.actionCard
  ) {
    return;
  }

  const root = document.documentElement;

  // Container styles
  root.style.setProperty('--cs-container-width', themeConfig.container.width);
  root.style.setProperty(
    '--cs-container-max-width',
    themeConfig.container.maxWidth
  );
  root.style.setProperty(
    '--cs-container-padding',
    themeConfig.container.padding
  );
  root.style.setProperty(
    '--cs-container-background',
    themeConfig.container.background
  );
  root.style.setProperty(
    '--cs-container-border-radius',
    themeConfig.container.borderRadius
  );
  root.style.setProperty(
    '--cs-container-box-shadow',
    themeConfig.container.boxShadow
  );

  // Layout styles
  root.style.setProperty(
    '--cs-visual-support-ratio',
    themeConfig.layout.visualSupportRatio
  );
  root.style.setProperty(
    '--cs-card-stream-ratio',
    themeConfig.layout.cardStreamRatio
  );
  root.style.setProperty(
    '--cs-panels-gap',
    themeConfig.layout.gapBetweenPanels
  );

  // Visual support styles
  root.style.setProperty(
    '--cs-visual-support-background',
    themeConfig.visualSupport.background
  );
  root.style.setProperty(
    '--cs-visual-support-border-right',
    themeConfig.visualSupport.borderRight
  );
  root.style.setProperty(
    '--cs-visual-support-content-background',
    themeConfig.visualSupport.content.background
  );
  root.style.setProperty(
    '--cs-visual-support-content-padding',
    themeConfig.visualSupport.content.padding
  );

  // Card stream styles
  root.style.setProperty(
    '--cs-card-stream-background',
    themeConfig.cardStream.background
  );
  root.style.setProperty(
    '--cs-card-stream-padding',
    themeConfig.cardStream.padding
  );
  root.style.setProperty(
    '--cs-card-spacing',
    themeConfig.cardStream.cardSpacing
  );

  // Card base styles
  root.style.setProperty(
    '--cs-card-background',
    themeConfig.card.base.background
  );
  root.style.setProperty(
    '--cs-card-border-radius',
    themeConfig.card.base.borderRadius
  );
  root.style.setProperty(
    '--cs-card-border-left',
    themeConfig.card.base.borderLeft
  );
  root.style.setProperty('--cs-card-padding', themeConfig.card.base.padding);
  root.style.setProperty(
    '--cs-card-margin-bottom',
    themeConfig.card.base.marginBottom
  );
  root.style.setProperty(
    '--cs-card-box-shadow',
    themeConfig.card.base.boxShadow
  );
  root.style.setProperty(
    '--cs-card-transition',
    themeConfig.card.base.transition
  );

  // Card hover styles
  root.style.setProperty(
    '--cs-card-hover-box-shadow',
    themeConfig.card.hover.boxShadow
  );
  root.style.setProperty(
    '--cs-card-hover-transform',
    themeConfig.card.hover.transform
  );

  // Typography styles
  root.style.setProperty(
    '--cs-font-size-base',
    themeConfig.typography.fontSizeBase
  );
  root.style.setProperty(
    '--cs-line-height-base',
    themeConfig.typography.lineHeightBase
  );
  root.style.setProperty(
    '--cs-font-weight-light',
    themeConfig.typography.fontWeightLight
  );
  root.style.setProperty(
    '--cs-font-weight-normal',
    themeConfig.typography.fontWeightNormal
  );
  root.style.setProperty(
    '--cs-font-weight-medium',
    themeConfig.typography.fontWeightMedium
  );
  root.style.setProperty(
    '--cs-font-weight-semibold',
    themeConfig.typography.fontWeightSemibold
  );

  // Card title styles
  root.style.setProperty(
    '--cs-card-title-font-size',
    themeConfig.card.title.fontSize
  );
  root.style.setProperty(
    '--cs-card-title-font-weight',
    themeConfig.card.title.fontWeight
  );
  root.style.setProperty('--cs-card-title-color', themeConfig.card.title.color);
  root.style.setProperty(
    '--cs-card-title-line-height',
    themeConfig.card.title.lineHeight
  );
  root.style.setProperty(
    '--cs-card-title-margin-bottom',
    themeConfig.card.title.marginBottom
  );

  // Card description styles
  root.style.setProperty(
    '--cs-card-description-font-size',
    themeConfig.card.description.fontSize
  );
  root.style.setProperty(
    '--cs-card-description-color',
    themeConfig.card.description.color
  );
  root.style.setProperty(
    '--cs-card-description-line-height',
    themeConfig.card.description.lineHeight
  );
  root.style.setProperty(
    '--cs-card-description-margin-bottom',
    themeConfig.card.description.marginBottom
  );

  // Step indicator styles
  root.style.setProperty(
    '--cs-step-indicator-font-size',
    themeConfig.card.stepIndicator.fontSize
  );
  root.style.setProperty(
    '--cs-step-indicator-font-weight',
    themeConfig.card.stepIndicator.fontWeight
  );
  root.style.setProperty(
    '--cs-step-indicator-color',
    themeConfig.card.stepIndicator.color
  );
  root.style.setProperty(
    '--cs-step-indicator-text-transform',
    themeConfig.card.stepIndicator.textTransform
  );
  root.style.setProperty(
    '--cs-step-indicator-letter-spacing',
    themeConfig.card.stepIndicator.letterSpacing
  );
  root.style.setProperty(
    '--cs-step-indicator-margin-bottom',
    themeConfig.card.stepIndicator.marginBottom
  );

  // Form elements styles
  root.style.setProperty(
    '--cs-form-group-margin-bottom',
    themeConfig.formElements.formGroup.marginBottom
  );
  root.style.setProperty(
    '--cs-field-row-gap',
    themeConfig.formElements.fieldRow.gap
  );
  root.style.setProperty(
    '--cs-field-row-margin-bottom',
    themeConfig.formElements.fieldRow.marginBottom
  );

  // Label styles
  root.style.setProperty(
    '--cs-label-font-size',
    themeConfig.formElements.label.fontSize
  );
  root.style.setProperty(
    '--cs-label-font-weight',
    themeConfig.formElements.label.fontWeight
  );
  root.style.setProperty(
    '--cs-label-color',
    themeConfig.formElements.label.color
  );
  root.style.setProperty(
    '--cs-label-text-transform',
    themeConfig.formElements.label.textTransform
  );
  root.style.setProperty(
    '--cs-label-letter-spacing',
    themeConfig.formElements.label.letterSpacing
  );
  root.style.setProperty(
    '--cs-label-margin-bottom',
    themeConfig.formElements.label.marginBottom
  );

  // Input styles
  const input = themeConfig.formElements.input;
  root.style.setProperty('--cs-input-font-size', input.fontSize);
  root.style.setProperty('--cs-input-font-weight', input.fontWeight);
  root.style.setProperty('--cs-input-color', input.color);
  root.style.setProperty('--cs-input-background', input.background);
  // Use individual border properties instead of shorthand
  root.style.setProperty(
    '--cs-input-border-bottom-width',
    input.borderBottomWidth
  );
  root.style.setProperty(
    '--cs-input-border-bottom-style',
    input.borderBottomStyle
  );
  root.style.setProperty(
    '--cs-input-border-bottom-color',
    input.borderBottomColor
  );
  root.style.setProperty('--cs-input-padding', input.padding);
  root.style.setProperty('--cs-input-border-radius', input.borderRadius);
  root.style.setProperty('--cs-input-transition', input.transition);
  root.style.setProperty(
    '--cs-input-placeholder-color',
    input.placeholder.color
  );
  root.style.setProperty(
    '--cs-input-hover-border-color',
    input.hover.borderBottomColor
  );
  root.style.setProperty(
    '--cs-input-focus-border-color',
    input.focus.borderBottomColor
  );
  root.style.setProperty(
    '--cs-input-error-border-color',
    input.error.borderBottomColor
  );

  // Color styles
  const colors = themeConfig.colors;
  root.style.setProperty('--cs-color-brand-primary', colors.brand.primary);
  root.style.setProperty(
    '--cs-color-brand-primary-hover',
    colors.brand.primaryHover
  );
  root.style.setProperty(
    '--cs-color-brand-primary-light',
    colors.brand.primaryLight
  );
  root.style.setProperty('--cs-color-text-primary', colors.text.primary);
  root.style.setProperty('--cs-color-text-secondary', colors.text.secondary);
  root.style.setProperty('--cs-color-text-tertiary', colors.text.tertiary);
  root.style.setProperty(
    '--cs-color-text-placeholder',
    colors.text.placeholder
  );
  root.style.setProperty('--cs-color-border-default', colors.border.default);
  root.style.setProperty('--cs-color-border-hover', colors.border.hover);
  root.style.setProperty(
    '--cs-color-background-primary',
    colors.background.primary
  );
  root.style.setProperty(
    '--cs-color-background-secondary',
    colors.background.secondary
  );
  root.style.setProperty(
    '--cs-color-background-tertiary',
    colors.background.tertiary
  );
  root.style.setProperty(
    '--cs-color-background-disabled',
    colors.background.disabled
  );

  // Animation styles
  const animations = themeConfig.animations;
  root.style.setProperty(
    '--cs-animation-duration-fast',
    animations.transitions.fast
  );
  root.style.setProperty(
    '--cs-animation-duration-default',
    animations.transitions.default
  );
  root.style.setProperty(
    '--cs-animation-duration-slow',
    animations.transitions.slow
  );
  root.style.setProperty(
    '--cs-animation-duration-slower',
    animations.transitions.slower
  );
  root.style.setProperty(
    '--cs-card-reveal-duration',
    animations.cardReveal.duration
  );
  root.style.setProperty(
    '--cs-card-reveal-easing',
    animations.cardReveal.easing
  );
};

/**
 * Get the current configuration object
 */
export const getCardStreamConfig = (): CardStreamConfig => {
  return cardStreamConfig;
};

/**
 * Get a specific value from the configuration using dot notation
 * Example: getConfigValue('colors.brand.primary') returns '#10b981'
 */
export const getConfigValue = (path: string): unknown => {
  const keys = path.split('.');
  let current: unknown = cardStreamConfig;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
};

/**
 * Create inline styles object from config paths
 * Usage: createConfigStyles({ padding: 'card.base.padding', color: 'colors.brand.primary' })
 */
export const createConfigStyles = (
  styleMap: Record<string, string>
): React.CSSProperties => {
  const styles: React.CSSProperties = {};

  for (const [cssProperty, configPath] of Object.entries(styleMap)) {
    const value = getConfigValue(configPath);
    if (value !== undefined) {
      (styles as any)[cssProperty] = value;
    }
  }

  return styles;
};

/**
 * React hook to use config values reactively
 */
export const useConfigValue = (path: string) => {
  return getConfigValue(path);
};

/**
 * Utility to apply theme when component mounts (for React)
 * This should be used in a React component context
 */
export const useCardStreamTheme = (
  customConfig?: Partial<CardStreamConfig>
) => {
  // This function should be used within a React component
  // The actual useEffect call should be in the component
  return { applyTheme: () => applyCardStreamTheme(customConfig) };
};

// Remove auto-apply to prevent hydration mismatch
// Theme will be applied explicitly by components that need it
