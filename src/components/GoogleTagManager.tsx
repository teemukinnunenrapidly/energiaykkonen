'use client';

import Script from 'next/script';

// Extend Window interface for jQuery and Cookiebot
declare global {
  interface Window {
    jQuery: any;
    $: any;
    Cookiebot: {
      consent: {
        marketing: boolean;
        statistics: boolean;
        preferences: boolean;
        necessary: boolean;
      };
    };
  }
}

interface GoogleTagManagerProps {
  gtmId: string;
}

export default function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  return (
    <>
      {/* jQuery for GTM compatibility */}
      <Script
        src="https://code.jquery.com/jquery-3.7.1.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Make jQuery available globally for GTM
          if (typeof window !== 'undefined' && window.jQuery) {
            window.$ = window.jQuery;
          }
        }}
      />

      {/* Google Tag Manager with Consent Mode v2 */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Block Cookiebot scripts from GTM completely
            window.Cookiebot = window.Cookiebot || {};
            window.Cookiebot.consent = {
              marketing: false,
              statistics: false,
              preferences: false,
              necessary: true
            };
            
            // Prevent Cookiebot scripts from loading
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
              const element = originalCreateElement.call(this, tagName);
              if (tagName.toLowerCase() === 'script') {
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                  if (name === 'src' && value && typeof value === 'string' && 
                      (value.includes('cookiebot.com') || value.includes('consent.cookiebot'))) {
                    console.log('[GTM] Blocked Cookiebot script:', value);
                    return;
                  }
                  return originalSetAttribute.call(this, name, value);
                };
              }
              return element;
            };
            
            // Initialize Google Consent Mode v2
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Set default consent state (deny all except necessary)
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'functionality_storage': 'denied',
              'personalization_storage': 'denied',
              'security_storage': 'granted'
            });
            
            // Wait for jQuery to be available before initializing GTM
            function initializeGTM() {
              if (typeof window.jQuery !== 'undefined') {
                try {
                  // Initialize GTM
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');
                  console.log('GTM initialized successfully with jQuery support');
                } catch (error) {
                  console.error('Error initializing GTM:', error);
                }
              } else {
                // Retry after a short delay if jQuery is not yet available
                setTimeout(initializeGTM, 100);
              }
            }
            
            // Fallback: Initialize GTM without jQuery after timeout
            setTimeout(function() {
              if (typeof window.jQuery === 'undefined') {
                console.warn('jQuery not available, initializing GTM without jQuery support');
                try {
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');
                } catch (error) {
                  console.error('Error initializing GTM fallback:', error);
                }
              }
            }, 2000);
            
            // Start GTM initialization
            initializeGTM();
          `,
        }}
      />
    </>
  );
}

export function GoogleTagManagerNoScript({ gtmId }: GoogleTagManagerProps) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
