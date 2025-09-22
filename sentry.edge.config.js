// This file configures the initialization of Sentry for edge runtime.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment-specific configuration
  environment: process.env.NODE_ENV,

  // Add custom tags for better filtering
  initialScope: {
    tags: {
      component: 'edge',
      application: 'energiaykkonen-calculator',
    },
  },

  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],

  _experiments: {
    enableLogs: true,
  },
  enableLogs: true,
});
