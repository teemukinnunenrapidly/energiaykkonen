// /src/hooks/useCardStyles.ts
import config from '../../cardstream-complete-config.json';

const styles = config.cardStreamConfig;

export function useCardStyles() {
  return {
    colors: styles.colors,
    card: styles.card,
    formElements: styles.formElements,
    calculationCard: styles.calculationCard,
    infoCard: styles.infoCard,
    actionCard: styles.actionCard,
    submitButton: styles.submitButton,
    typography: styles.typography,
    animations: styles.animations,
    container: styles.container,
    layout: styles.layout,
    visualSupport: styles.visualSupport,
    cardStream: styles.cardStream,
    responsive: styles.responsive,
    accessibility: styles.accessibility,
    features: styles.features,
  };
}

// Design token utility functions
export function getToken(path: string): any {
  const keys = path.split('.');
  let value: any = styles;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      break;
    }
  }

  return value;
}

// Create CSS properties object from token paths
export function createTokenStyles(
  tokenPaths: Record<string, string>
): React.CSSProperties {
  const result: any = {};

  Object.entries(tokenPaths).forEach(([cssProperty, tokenPath]) => {
    const value = getToken(tokenPath);
    if (value !== undefined) {
      result[cssProperty] = value;
    }
  });

  return result;
}

// Helper function to safely cast CSS values for TypeScript
export function cssValue(value: any): any {
  return value;
}

// Mappaus kovakoodatuista → tokeneihin
export const tokenMap = {
  '#10b981': styles.colors.brand.primary,
  '#059669': styles.colors.brand.primaryHover,
  '#3b82f6': styles.colors.state.info,
  '#ef4444': styles.colors.state.error,
  '#6b7280': styles.colors.text.secondary,
  '#9ca3af': styles.colors.text.tertiary,
  '#d1d5db': styles.colors.text.placeholder,
  '#1f2937': styles.colors.text.primary,
  '#f3f4f6': styles.colors.background.tertiary,
  '#e5e7eb': styles.colors.border.default,

  // Typography mappings
  '24px': styles.card.title.fontSize,
  '14px': styles.typography.fontSizeBase,
  '12px': styles.formElements.errorMessage.fontSize,
  '11px': styles.formElements.label.fontSize,
  '48px': styles.calculationCard.metricValue.fontSize,

  // Font weights
  bold: styles.typography.fontWeightSemibold,
  '500': styles.typography.fontWeightMedium,
  '300': styles.typography.fontWeightLight,
  '400': styles.typography.fontWeightNormal,

  // Spacing and layout
  '32px': styles.card.base.padding,
  '20px': styles.cardStream.cardSpacing,
  borderRadius12: styles.card.base.borderRadius,

  // Transitions
  '200ms': styles.animations.transitions.default,
  '500ms': styles.animations.transitions.slower,
};
