'use client';

import {
  gtmEvents,
  consentAwareAnalytics,
  hasAnalyticsConsent,
  hasMarketingConsent,
} from '@/config/gtm';
import {
  getConsentPreferences,
  clearConsent,
} from '@/components/CookieConsentBanner';

export default function TestGTMPage() {
  const testEvents = () => {
    try {
      // Test various GTM events
      gtmEvents.formStart('test_form');
      gtmEvents.calculationStart('test_calculation');
      gtmEvents.calculationComplete('test_calculation', {
        result: '1000',
        unit: 'kWh',
      });
      gtmEvents.formSubmit('test_form', { test_data: 'example' });
      gtmEvents.pdfGenerated('test_card', 'test_lead_123');
      gtmEvents.emailSent('test_email', 'test_lead_123');
      gtmEvents.errorOccurred('test_error', 'This is a test error');
      gtmEvents.firstCardCompleted('test_card', 'test_card_id_123');

      // GTM test events sent! Check your browser dev tools and GTM preview mode.
    } catch {
      // Error sending GTM test events
      alert('Error sending test events. Check console for details.');
    }
  };

  const testConsentAwareEvents = () => {
    // Test consent-aware analytics
    consentAwareAnalytics.pageView(window.location.href);
    consentAwareAnalytics.event('test_consent_event', {
      test_property: 'test_value',
      consent_status: 'checked',
    });
    consentAwareAnalytics.conversion('AW-CONVERSION_ID/CONVERSION_LABEL', {
      value: 1.0,
      currency: 'EUR',
    });

    // Consent-aware events sent! Check consent status below.
  };

  const checkConsentStatus = () => {
    const preferences = getConsentPreferences();
    const analytics = hasAnalyticsConsent();
    const marketing = hasMarketingConsent();
    const jqueryAvailable = typeof window.jQuery !== 'undefined';
    const gtmAvailable = typeof window.dataLayer !== 'undefined';

    // System Status logged

    alert(`System Status:
Analytics: ${analytics ? '✅ Granted' : '❌ Denied'}
Marketing: ${marketing ? '✅ Granted' : '❌ Denied'}
jQuery: ${jqueryAvailable ? '✅ Available' : '❌ Not Available'}
GTM: ${gtmAvailable ? '✅ Available' : '❌ Not Available'}

Full preferences: ${JSON.stringify(preferences, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">GTM Test Page</h1>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">
            Test Google Tag Manager Events
          </h2>
          <p className="text-gray-600 mb-6">
            Klikkaa alla olevia painikkeita testataksesi GTM events ja consent
            järjestelmää. Cookie consent pop-up tulee esille heti sivun
            latautuessa jos consentia ei ole annettu. Tarkista selaimen
            developer tools konsoli ja GTM preview mode nähdäksesi lähetetyt
            events.
          </p>

          <div className="space-y-3">
            <button
              onClick={testEvents}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lähetä test events
            </button>

            <button
              onClick={testConsentAwareEvents}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Testaa consent-aware events
            </button>

            <button
              onClick={checkConsentStatus}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Tarkista järjestelmän status
            </button>

            <button
              onClick={clearConsent}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tyhjennä consent & lataa uudelleen
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Events being tested:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• calc_form_start</li>
              <li>• calc_calculation_start</li>
              <li>• calc_calculation_complete</li>
              <li>• calc_form_submit</li>
              <li>• calc_pdf_generated</li>
              <li>• calc_email_sent</li>
              <li>• calc_error_occurred</li>
              <li>• calc_first_card_completed</li>
              <li>• Consent-aware analytics events</li>
              <li>• Google Consent Mode v2 integration</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Kuinka varmistaa GTM & Consent Mode toimivuus:
          </h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Avaa selaimen developer tools (F12)</li>
            <li>2. Mene Console välilehdelle</li>
            <li>
              3. Klikkaa &quot;Tarkista consent status&quot; nähdäksesi nykyinen
              consent
            </li>
            <li>
              4. Klikkaa &quot;Lähetä test events&quot; testataksesi perus GTM
              events
            </li>
            <li>
              5. Klikkaa &quot;Testaa consent-aware events&quot; testataksesi
              consent integraatiota
            </li>
            <li>6. Tarkista dataLayer.push() kutsut konsolissa</li>
            <li>7. Käytä GTM Preview modea nähdäksesi events reaaliajassa</li>
            <li>8. Tarkista Google Consent Mode v2 status GTM:ssä</li>
          </ol>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            Consent Mode v2 Features:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Automatic consent state management</li>
            <li>• GDPR-compliant cookie banner</li>
            <li>• Granular consent preferences</li>
            <li>• Consent-aware analytics tracking</li>
            <li>• Automatic GTM tag firing control</li>
            <li>• Privacy policy integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
