// /src/hooks/useCardStyles.ts
// Import from wrapper to keep a single import site for JSON and avoid HMR pattern mismatches
import { cardStreamConfig as styles } from '@/config/cardstream-config';

// `styles` now references the token object directly

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
    // Custom overrides for CalculationCard redesign
    customCalculationCard: {
      container: {
        // Don't spread base calculationCard.container - it has a light green gradient we don't want
        width: '100%',
        maxWidth: '100%',
        background: styles.colors.brand.primary, // Brand green background
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 10px 30px rgba(10, 117, 38, 0.2)', // Green-tinted shadow matching new brand color
        padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px)', // Fluid padding
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      },
      header: {
        marginBottom: '32px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      iconContainer: {
        width: 'clamp(48px, 10vw, 64px)', // Fluid size
        height: 'clamp(48px, 10vw, 64px)', // Fluid size
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      icon: {
        color: '#ffffff',
        width: 'clamp(24px, 5vw, 32px)', // Fluid icon size
        height: 'clamp(24px, 5vw, 32px)', // Fluid icon size
      },
      title: {
        ...styles.calculationCard.title,
        fontSize: 'clamp(24px, 5vw, 32px)', // Fluid font size
        fontWeight: styles.typography.fontWeightSemibold,
        marginBottom: '16px',
        color: '#ffffff', // White title
      },
      description: {
        ...styles.calculationCard.description,
        fontSize: '18px',
        color: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: '1.6',
      },
      resultSection: {
        margin: '40px 0',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignItems: 'baseline',
      },
      metricValue: {
        fontSize: 'clamp(48px, 12vw, 80px)',
        fontWeight: styles.typography.fontWeightSemibold,
        color: '#ffffff',
        lineHeight: '1',
        textShadow: '0 0 30px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.1)',
      },
      metricUnit: {
        fontSize: 'clamp(20px, 4vw, 32px)', // Fluid font size for unit
        fontWeight: styles.typography.fontWeightMedium,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: '12px',
        marginBottom: '12px',
      },
      editButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: styles.typography.fontWeightMedium,
        color: '#ffffff',
        background: 'rgba(255, 255, 255, 0.1)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '100px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: '0',
        backdropFilter: 'blur(10px)',
      },
      editButtonHover: {
        background: 'rgba(255, 255, 255, 0.2)',
        borderColor: '#ffffff',
        color: '#ffffff',
      },
      editSection: {
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto 40px auto',
      },
      nextButtonSection: {
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
      },
    },
    // Inverted calculator card style (white background, green accents)
    invertedCalculationCard: {
      container: {
        width: '100%',
        maxWidth: '100%',
        background: '#f3f3f3',
        borderRadius: '12px',
        border: `2px solid ${styles.colors.brand.primary}`,
        boxShadow: '0 10px 30px rgba(10, 117, 38, 0.1)',
        padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        color: styles.colors.brand.primary,
        position: 'relative',
        overflow: 'hidden',
      },
      // Mobile: remove border
      containerMobile: {
        border: 'none',
        borderRadius: '0',
        padding: 'clamp(20px, 4vw, 32px) clamp(12px, 3vw, 24px)',
      },
      header: {
        marginBottom: '32px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      iconContainer: {
        width: 'clamp(48px, 10vw, 64px)',
        height: 'clamp(48px, 10vw, 64px)',
        borderRadius: '50%',
        background: `${styles.colors.brand.primary}15`, // Green with 15% opacity
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(10, 117, 38, 0.1)',
        border: `1px solid ${styles.colors.brand.primary}30`,
      },
      icon: {
        color: styles.colors.brand.primary,
        width: 'clamp(24px, 5vw, 32px)',
        height: 'clamp(24px, 5vw, 32px)',
      },
      title: {
        ...styles.calculationCard.title,
        fontSize: 'clamp(24px, 5vw, 32px)',
        fontWeight: styles.typography.fontWeightSemibold,
        marginBottom: '16px',
        color: styles.colors.brand.primary,
      },
      description: {
        ...styles.calculationCard.description,
        fontSize: '18px',
        color: styles.colors.text.secondary,
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: '1.6',
      },
      resultSection: {
        margin: '40px 0',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignItems: 'baseline',
      },
      metricValue: {
        fontSize: 'clamp(48px, 12vw, 80px)',
        fontWeight: styles.typography.fontWeightSemibold,
        color: styles.colors.brand.primary,
        lineHeight: '1',
        textShadow:
          '0 0 25px rgba(13, 148, 48, 0.15), 0 2px 4px rgba(0,0,0,0.05)',
      },
      metricUnit: {
        fontSize: 'clamp(20px, 4vw, 32px)',
        fontWeight: styles.typography.fontWeightMedium,
        color: styles.colors.brand.primaryHover,
        marginLeft: '12px',
        marginBottom: '12px',
      },
      editButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: styles.typography.fontWeightMedium,
        color: styles.colors.brand.primary,
        background: `${styles.colors.brand.primary}10`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `${styles.colors.brand.primary}40`,
        borderRadius: '100px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: '0',
        backdropFilter: 'blur(10px)',
      },
      editButtonHover: {
        background: `${styles.colors.brand.primary}20`,
        borderColor: styles.colors.brand.primary,
        color: styles.colors.brand.primary,
      },
      editSection: {
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto 40px auto',
      },
      nextButtonSection: {
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
      },
      // Badge for "Muokattu" indicator
      overriddenBadge: {
        background: `${styles.colors.brand.primary}20`,
        color: styles.colors.brand.primary,
      },
      // Input styling for inline editing
      inputUnderline: {
        borderBottom: `3px solid ${styles.colors.brand.primary}60`,
        caretColor: styles.colors.brand.primary,
      },
    },
    // Visual Overlay FormCard style (full-width visual bg, form on golden ratio right side)
    visualOverlayFormCard: {
      // Outer wrapper - full width with visual as background
      wrapper: {
        width: '100%',
        minHeight: '500px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end', // Push form to the right
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      },
      // Dark overlay for better form readability
      overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)',
        zIndex: 1,
      },
      // Form container - positioned at golden ratio (~38.2% width from the right)
      formContainer: {
        position: 'relative',
        zIndex: 2,
        width: '38.2%', // Golden ratio minor
        minWidth: '320px',
        maxWidth: '450px',
        marginRight: '5%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        padding: 'clamp(24px, 4vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
      },
      // Mobile: form takes full width
      formContainerMobile: {
        width: '100%',
        minWidth: 'unset',
        maxWidth: 'unset',
        marginRight: 0,
        borderRadius: 0,
        minHeight: '100%',
      },
      header: {
        marginBottom: '24px',
        textAlign: 'center',
      },
      title: {
        fontSize: 'clamp(20px, 4vw, 28px)',
        fontWeight: styles.typography.fontWeightSemibold,
        color: styles.colors.brand.primary,
        marginBottom: '8px',
        lineHeight: '1.2',
      },
      description: {
        fontSize: '15px',
        color: styles.colors.text.secondary,
        lineHeight: '1.5',
        marginBottom: '0',
      },
      formSection: {
        width: '100%',
        textAlign: 'left',
      },
      submitWrapper: {
        width: '100%',
        marginTop: '16px',
      },
      submitButton: {
        width: '100%',
        padding: '14px 24px',
        fontSize: '16px',
        fontWeight: styles.typography.fontWeightSemibold,
        color: '#ffffff',
        background: styles.colors.brand.primary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
      },
      submitButtonHover: {
        background: styles.colors.brand.primaryHover,
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(10, 117, 38, 0.3)',
      },
    },
    // CTA Card style - full-width with columns: content (left) + form (right)
    ctaFormCard: {
      // Outer wrapper - full width background
      wrapper: {
        width: '100%',
        background: `linear-gradient(135deg, ${styles.colors.brand.primary} 0%, ${styles.colors.brand.primaryHover} 100%)`,
        borderRadius: '16px',
        padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(32px, 5vw, 64px)',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(10, 117, 38, 0.25)',
      },
      // Mobile: stack vertically
      wrapperMobile: {
        gridTemplateColumns: '1fr',
        gap: '24px',
        padding: 'clamp(24px, 4vw, 40px) clamp(12px, 3vw, 24px)',
        textAlign: 'center',
        border: 'none',
        borderRadius: '0',
      },
      // Decorative background element
      backgroundDecoration: {
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '60%',
        height: '200%',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '50%',
        pointerEvents: 'none',
      },
      // Left column - content area
      contentColumn: {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      },
      // Badge/label above title
      badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(8px)',
        padding: '8px 16px',
        borderRadius: '100px',
        fontSize: '13px',
        fontWeight: styles.typography.fontWeightMedium,
        color: '#ffffff',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        width: 'fit-content',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      title: {
        fontSize: 'clamp(28px, 5vw, 40px)',
        fontWeight: styles.typography.fontWeightSemibold,
        color: '#ffffff',
        lineHeight: '1.15',
        letterSpacing: '-0.02em',
        margin: 0,
      },
      description: {
        fontSize: 'clamp(16px, 2vw, 18px)',
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: '1.6',
        maxWidth: '500px',
        margin: 0,
      },
      // Trust indicators / benefits list
      benefitsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '8px',
      },
      benefitItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '15px',
        color: 'rgba(255, 255, 255, 0.95)',
      },
      benefitIcon: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#ffffff',
        fontSize: '12px',
      },
      // Right column - form container
      formColumn: {
        position: 'relative',
        zIndex: 2,
        background: '#ffffff',
        borderRadius: '16px',
        padding: 'clamp(24px, 4vw, 36px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
      formHeader: {
        marginBottom: '24px',
        textAlign: 'center',
      },
      formTitle: {
        fontSize: 'clamp(18px, 3vw, 22px)',
        fontWeight: styles.typography.fontWeightSemibold,
        color: styles.colors.text.primary,
        marginBottom: '8px',
        lineHeight: '1.3',
      },
      formDescription: {
        fontSize: '14px',
        color: styles.colors.text.secondary,
        lineHeight: '1.5',
        margin: 0,
      },
      formSection: {
        width: '100%',
      },
      submitWrapper: {
        width: '100%',
        marginTop: '20px',
      },
      submitButton: {
        width: '100%',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: styles.typography.fontWeightSemibold,
        color: '#ffffff',
        background: styles.colors.brand.primary,
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        boxShadow: '0 4px 14px rgba(10, 117, 38, 0.3)',
      },
      submitButtonHover: {
        background: styles.colors.brand.primaryHover,
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(10, 117, 38, 0.4)',
      },
    },
    // Inverted CTA Card style - light gray background with green accents
    ctaFormCardInverted: {
      // Outer wrapper - light gray background with subtle border
      wrapper: {
        width: '100%',
        background: '#f3f3f3',
        borderRadius: '16px',
        padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(32px, 5vw, 64px)',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: `2px solid ${styles.colors.brand.primary}`,
        boxShadow: '0 10px 40px rgba(10, 117, 38, 0.1)',
      },
      // Mobile: stack vertically
      wrapperMobile: {
        gridTemplateColumns: '1fr',
        gap: '24px',
        padding: 'clamp(24px, 4vw, 40px) clamp(12px, 3vw, 24px)',
        textAlign: 'center',
        border: 'none',
        borderRadius: '0',
      },
      // Decorative background element - subtle green tint
      backgroundDecoration: {
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '60%',
        height: '200%',
        background: `${styles.colors.brand.primary}05`,
        borderRadius: '50%',
        pointerEvents: 'none',
      },
      // Left column - content area
      contentColumn: {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      },
      // Badge/label above title - green background
      badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: `${styles.colors.brand.primary}15`,
        backdropFilter: 'blur(8px)',
        padding: '8px 16px',
        borderRadius: '100px',
        fontSize: '13px',
        fontWeight: styles.typography.fontWeightMedium,
        color: styles.colors.brand.primary,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        width: 'fit-content',
        border: `1px solid ${styles.colors.brand.primary}30`,
      },
      title: {
        fontSize: 'clamp(28px, 5vw, 40px)',
        fontWeight: styles.typography.fontWeightSemibold,
        color: styles.colors.brand.primary,
        lineHeight: '1.15',
        letterSpacing: '-0.02em',
        margin: 0,
      },
      description: {
        fontSize: 'clamp(16px, 2vw, 18px)',
        color: styles.colors.text.secondary,
        lineHeight: '1.6',
        maxWidth: '500px',
        margin: 0,
      },
      // Trust indicators / benefits list
      benefitsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '8px',
      },
      benefitItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '15px',
        color: styles.colors.text.primary,
      },
      benefitIcon: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: `${styles.colors.brand.primary}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: styles.colors.brand.primary,
        fontSize: '12px',
      },
      // Right column - form container with green background
      formColumn: {
        position: 'relative',
        zIndex: 2,
        background: '#ffffff',
        borderRadius: '16px',
        padding: 'clamp(24px, 4vw, 36px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
      formSection: {
        width: '100%',
      },
      submitWrapper: {
        width: '100%',
        marginTop: '20px',
      },
      // Green submit button on white form
      submitButton: {
        width: '100%',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: styles.typography.fontWeightSemibold,
        color: '#ffffff',
        background: styles.colors.brand.primary,
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        boxShadow: '0 4px 14px rgba(10, 117, 38, 0.3)',
      },
      submitButtonHover: {
        background: styles.colors.brand.primaryHover,
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(10, 117, 38, 0.4)',
      },
      // Form element styles for white background with green accents
      formLabelColor: styles.colors.brand.primary,
      formInputBackground: '#ffffff',
      formInputBorder: styles.colors.brand.primary,
      // Yhteenvetolaatikko (Summary box)
      summaryBox: {
        background: 'transparent',
        borderRadius: '12px',
        padding: '20px 0',
        marginTop: '24px',
      },
      summaryTitle: {
        fontSize: '14px',
        fontWeight: styles.typography.fontWeightSemibold,
        color: styles.colors.brand.primary,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '16px',
        margin: 0,
      },
      summaryList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      },
      summaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid rgba(10, 117, 38, 0.1)',
      },
      summaryLabel: {
        fontSize: '14px',
        color: styles.colors.text.secondary,
      },
      summaryValue: {
        fontSize: '15px',
        fontWeight: styles.typography.fontWeightSemibold,
        color: styles.colors.brand.primary,
        textAlign: 'right',
      },
    },
    // Highlight FormCard style (minimal, centered, 50% width)
    highlightFormCard: {
      container: {
        width: '50%',
        maxWidth: '500px',
        minWidth: '300px',
        margin: '0 auto',
        background: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        borderRadius: '16px',
        padding: 'clamp(32px, 5vw, 48px) clamp(24px, 4vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      },
      header: {
        width: '100%',
        marginBottom: '24px',
        textAlign: 'center',
      },
      title: {
        fontSize: 'clamp(24px, 5vw, 32px)',
        fontWeight: styles.typography.fontWeightSemibold,
        color: styles.colors.brand.primary,
        marginBottom: '12px',
        lineHeight: '1.2',
      },
      description: {
        fontSize: '16px',
        color: styles.colors.text.secondary,
        lineHeight: '1.5',
        marginBottom: '0',
      },
      formSection: {
        width: '100%',
        textAlign: 'left',
      },
      submitWrapper: {
        width: '100%',
        marginTop: '20px',
      },
      submitButton: {
        width: '100%',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: styles.typography.fontWeightSemibold,
        color: '#ffffff',
        background: styles.colors.brand.primary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
      },
      submitButtonHover: {
        background: styles.colors.brand.primaryHover,
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(10, 117, 38, 0.3)',
      },
    },
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
  '#0d9430': styles.colors.brand.primary,
  '#0a7526': styles.colors.brand.primaryHover,
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
