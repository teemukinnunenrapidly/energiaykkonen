'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Cookie, Settings, Shield } from 'lucide-react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentBannerProps {
  onConsentChange?: (preferences: ConsentPreferences) => void;
  showSettings?: boolean;
  theme?: 'light' | 'dark';
}

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true, // Always true, can't be disabled
  analytics: false,
  marketing: false,
  preferences: false,
};

const CONSENT_STORAGE_KEY = 'cookie_consent_preferences';
const CONSENT_VERSION = '1.0';

export function CookieConsentBanner({
  onConsentChange,
  showSettings = true,
  theme = 'light',
}: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [preferences, setPreferences] =
    useState<ConsentPreferences>(DEFAULT_PREFERENCES);

  // Load saved preferences on mount
  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences);
          // Don't show banner if consent already given
          setIsVisible(false);
          return;
        }
      } catch {
        // Failed to parse saved consent preferences
      }
    }

    // Show banner immediately if no consent given
    setIsVisible(true);
  }, []);

  // Handle ESC key (but don't close - user must make a choice)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        // Don't close on ESC - user must make a choice for GDPR compliance
        event.preventDefault();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  // Update Google Consent Mode when preferences change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        ad_user_data: preferences.marketing ? 'granted' : 'denied',
        ad_personalization: preferences.marketing ? 'granted' : 'denied',
        functionality_storage: preferences.preferences ? 'granted' : 'denied',
        personalization_storage: preferences.preferences ? 'granted' : 'denied',
        security_storage: 'granted', // Always granted
      });

      // Push custom event for GTM compatibility with energiaykkonen.fi
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'cookie_consent_update',
        consent_analytics: preferences.analytics,
        consent_marketing: preferences.marketing,
        consent_preferences: preferences.preferences,
        consent_necessary: preferences.necessary,
      });
    }
  }, [preferences]);

  const savePreferences = (newPreferences: ConsentPreferences) => {
    const consentData = {
      version: CONSENT_VERSION,
      preferences: newPreferences,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    setPreferences(newPreferences);
    setIsVisible(false);
    setShowSettingsPanel(false);

    if (onConsentChange) {
      onConsentChange(newPreferences);
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptNecessary = () => {
    savePreferences(DEFAULT_PREFERENCES);
  };

  const handleSaveCustomPreferences = () => {
    savePreferences(preferences);
  };

  const updatePreference = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'necessary') {
      return;
    } // Can't change necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!isVisible) {
    return null;
  }

  const bannerClasses = `
    fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4
  `;

  const popupClasses = `
    bg-white rounded-lg shadow-2xl max-w-md w-full mx-4
    ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
    border border-gray-200
    transform transition-all duration-300 ease-out
    ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
    animate-in fade-in-0 zoom-in-95 duration-300
  `;

  const settingsPanelClasses = `
    fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4
  `;

  return (
    <>
      {/* Main Popup */}
      <div
        className={bannerClasses}
        onClick={e => {
          // Close popup when clicking background
          if (e.target === e.currentTarget) {
            // Don't close on background click for better UX
            // User must make a choice
          }
        }}
      >
        <div className={popupClasses}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cookie className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-semibold">Evästeet</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Käytämme evästeitä käyttökokemuksen parantamiseen, sivuston käytön
              analysoimiseen ja markkinointitoimintaan. Klikkaamalla
              &quot;Hyväksy kaikki&quot; suostut evästeiden käyttöön.{' '}
              <a
                href="https://energiaykkonen.fi/evasteseloste/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Lue lisää evästeselosteesta
              </a>
            </p>

            <div className="flex flex-col gap-3">
              {showSettings && (
                <Button
                  variant="outline"
                  onClick={() => setShowSettingsPanel(true)}
                  className="flex items-center justify-center gap-2 w-full"
                >
                  <Settings className="h-4 w-4" />
                  Mukauta evästeet
                </Button>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleAcceptNecessary}
                  className="flex-1"
                >
                  Vain välttämättömät
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Hyväksy kaikki
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettingsPanel && (
        <div className={settingsPanelClasses}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Evästeasetukset
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600">
                Hallinnoi evästeasetuksiasi. Voit ottaa käyttöön tai poistaa
                käytöstä erityyppisiä evästeitä alla.
              </p>

              {/* Necessary Cookies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">Välttämättömät evästeet</h4>
                    <p className="text-sm text-gray-600">
                      Oleelliset evästeet, jotka ovat välttämättömiä sivuston
                      toiminnan kannalta.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.necessary}
                    disabled
                    className="ml-4"
                  />
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">Analytiikka evästeet</h4>
                    <p className="text-sm text-gray-600">
                      Auttavat meitä ymmärtämään, miten vierailijat käyttävät
                      sivustoamme keräämällä anonyymiä tietoa.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.analytics}
                    onCheckedChange={checked =>
                      updatePreference('analytics', !!checked)
                    }
                    className="ml-4"
                  />
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">Markkinointi evästeet</h4>
                    <p className="text-sm text-gray-600">
                      Käytetään vierailijoiden seuraamiseen eri sivustojen
                      välillä asianmukaisten mainosten näyttämiseen.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.marketing}
                    onCheckedChange={checked =>
                      updatePreference('marketing', !!checked)
                    }
                    className="ml-4"
                  />
                </div>
              </div>

              {/* Preference Cookies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">Asetus evästeet</h4>
                    <p className="text-sm text-gray-600">
                      Muistavat valintasi ja asetukset henkilökohtaisemman
                      käyttökokemuksen tarjoamiseksi.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.preferences}
                    onCheckedChange={checked =>
                      updatePreference('preferences', !!checked)
                    }
                    className="ml-4"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleAcceptNecessary}
                  className="flex-1"
                >
                  Vain välttämättömät
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Hyväksy kaikki
                </Button>
                <Button
                  onClick={handleSaveCustomPreferences}
                  className="flex-1"
                >
                  Tallenna asetukset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Utility functions for checking consent
export const getConsentPreferences = (): ConsentPreferences | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version === CONSENT_VERSION) {
        return parsed.preferences;
      }
    }
  } catch {
    // Failed to get consent preferences
  }

  return null;
};

export const hasConsent = (type: keyof ConsentPreferences): boolean => {
  const preferences = getConsentPreferences();
  return preferences ? preferences[type] : false;
};

export const clearConsent = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.location.reload(); // Reload to show banner again
  }
};
