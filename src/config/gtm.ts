// Google Tag Manager Configuration
export const GTM_ID = 'GTM-KVS6J6V';

// DataLayer type definitions for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Consent Mode v2 types
export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

// Helper function to push events to dataLayer
export const gtmPush = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data);
  }
};

// Consent-aware GTM events for the calculator
export const gtmEvents = {
  // Form submission events
  formStart: (formName: string) =>
    gtmPush({
      event: 'calc_form_start',
      form_name: formName,
    }),

  formSubmit: (formName: string, formData?: any) =>
    gtmPush({
      event: 'calc_form_submit',
      form_name: formName,
      form_data: formData,
    }),

  // Calculator events
  calculationStart: (cardName: string) =>
    gtmPush({
      event: 'calc_calculation_start',
      card_name: cardName,
    }),

  calculationComplete: (cardName: string, result: any) =>
    gtmPush({
      event: 'calc_calculation_complete',
      card_name: cardName,
      calculation_result: result,
    }),

  // PDF generation events
  pdfGenerated: (cardName: string, leadId: string) =>
    gtmPush({
      event: 'calc_pdf_generated',
      card_name: cardName,
      lead_id: leadId,
    }),

  // Email events
  emailSent: (emailType: string, leadId: string) =>
    gtmPush({
      event: 'calc_email_sent',
      email_type: emailType,
      lead_id: leadId,
    }),

  // Error events
  errorOccurred: (errorType: string, errorMessage: string) =>
    gtmPush({
      event: 'calc_error_occurred',
      error_type: errorType,
      error_message: errorMessage,
    }),

  // Card progress events
  firstCardCompleted: (cardName: string, cardId: string) =>
    gtmPush({
      event: 'calc_first_card_completed',
      card_name: cardName,
      card_id: cardId,
      milestone: 'first_completion',
    }),
};

// Consent-aware analytics wrapper
export const consentAwareAnalytics = {
  // Track page view only if analytics consent is granted
  pageView: (url: string) => {
    if (typeof window !== 'undefined' && window.gtag && hasAnalyticsConsent()) {
      window.gtag('config', GTM_ID, {
        page_location: url,
      });
    }
  },

  // Track event only if analytics consent is granted
  event: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag && hasAnalyticsConsent()) {
      window.gtag('event', eventName, parameters);
    }
  },

  // Track conversion only if marketing consent is granted
  conversion: (conversionId: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag && hasMarketingConsent()) {
      window.gtag('event', 'conversion', {
        send_to: conversionId,
        ...parameters,
      });
    }
  },
};

// Helper functions to check consent
export const hasAnalyticsConsent = (): boolean => {
  try {
    const saved = localStorage.getItem('cookie_consent_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.preferences?.analytics === true;
    }
  } catch {
    // Failed to check analytics consent
  }
  return false;
};

export const hasMarketingConsent = (): boolean => {
  try {
    const saved = localStorage.getItem('cookie_consent_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.preferences?.marketing === true;
    }
  } catch {
    // Failed to check marketing consent
  }
  return false;
};

export const hasPreferencesConsent = (): boolean => {
  try {
    const saved = localStorage.getItem('cookie_consent_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.preferences?.preferences === true;
    }
  } catch {
    // Failed to check preferences consent
  }
  return false;
};
