// This file configures the initialization of Sentry on the browser/client side.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment-specific configuration
  environment: process.env.NODE_ENV,

  // Add custom tags for better filtering
  initialScope: {
    tags: {
      component: 'client',
      application: 'energiaykkonen-calculator',
    },
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Facebook flakiness
    'fb_xd_fragment',
    // ISP "optimizing" proxy
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // Chrome extensions
    'atomicFindClose',
    // Generic error messages that aren't actionable
    'Script error.',
    'Non-Error promise rejection captured',
  ],

  // Filter out transactions we don't care about
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Sentry event (dev mode):', event);
      return null;
    }

    // Filter out events from bots
    const userAgent = event.request?.headers?.['User-Agent'] || '';
    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      return null;
    }

    return event;
  },
});
