// Google Consent Mode v2 Configuration
// This file handles Google Consent Mode v2 integration for GDPR compliance

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

// Default consent state (deny all except necessary)
const DEFAULT_CONSENT_STATE = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted', // Always granted
};

// Initialize Google Consent Mode v2
export const initializeConsentMode = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Set default consent state
  if (window.gtag) {
    window.gtag('consent', 'default', DEFAULT_CONSENT_STATE);
  }
};

// Update consent based on user preferences
export const updateConsentMode = (preferences: ConsentPreferences) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const consentUpdate = {
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
    functionality_storage: preferences.preferences ? 'granted' : 'denied',
    personalization_storage: preferences.preferences ? 'granted' : 'denied',
    security_storage: 'granted', // Always granted
  };

  window.gtag('consent', 'update', consentUpdate);

  // Log consent update for debugging
  // Consent Mode updated
};

// Enhanced GTM initialization with consent mode
export const initializeGTMWithConsent = (gtmId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize consent mode first
  initializeConsentMode();

  // Initialize GTM
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;

  // Set up dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: any[]) {
    window.dataLayer.push(args);
  };

  // Configure gtag with consent mode
  window.gtag('js', new Date());
  window.gtag('config', gtmId, {
    // Additional configuration can be added here
  });

  // Add script to document
  document.head.appendChild(script);
};

// Check if consent is required (for EU users)
export const isConsentRequired = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Simple EU detection based on timezone
  // In production, you might want to use a more sophisticated method
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const euTimezones = [
    'Europe/',
    'Atlantic/Azores',
    'Atlantic/Canary',
    'Atlantic/Madeira',
  ];

  return euTimezones.some(tz => timezone.includes(tz));
};

// Get user's country for consent requirements
export const getUserCountry = async (): Promise<string | null> => {
  try {
    // Using a free IP geolocation service
    // In production, consider using a more reliable service
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || null;
  } catch {
    // Failed to detect user country
    return null;
  }
};

// Enhanced consent checking with country detection
export const requiresConsent = async (): Promise<boolean> => {
  const country = await getUserCountry();

  // Countries that require GDPR-like consent
  const consentRequiredCountries = [
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
    'GB',
    'NO',
    'IS',
    'LI',
  ];

  return country
    ? consentRequiredCountries.includes(country)
    : isConsentRequired();
};

// Consent analytics wrapper
export const consentAwareAnalytics = {
  // Track page view only if analytics consent is granted
  pageView: (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      // Check if analytics consent is granted
      const preferences = getConsentPreferences();
      if (preferences?.analytics) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          page_location: url,
        });
      }
    }
  },

  // Track event only if analytics consent is granted
  event: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const preferences = getConsentPreferences();
      if (preferences?.analytics) {
        window.gtag('event', eventName, parameters);
      }
    }
  },
};

// Helper function to get consent preferences (from cookie banner)
const getConsentPreferences = (): ConsentPreferences | null => {
  try {
    const saved = localStorage.getItem('cookie_consent_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version === '1.0') {
        return parsed.preferences;
      }
    }
  } catch {
    // Failed to get consent preferences
  }

  return null;
};

// Export types and utilities
export { DEFAULT_CONSENT_STATE };
