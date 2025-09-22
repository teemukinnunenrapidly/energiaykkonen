// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
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
      component: 'server',
      application: 'energiaykkonen-calculator',
    },
  },

  // Server-specific integrations
  integrations: [
    // Add server-specific integrations here if needed
    // Send console logs to Sentry as logs
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],

  // Filter server-side events
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Sentry server event (dev mode):', event);
      return null;
    }

    // Add server-specific filtering logic here
    return event;
  },

  // Custom error handling for server
  beforeSendTransaction(event) {
    // Filter out health check and monitoring requests
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }

    if (event.request?.url?.includes('/favicon.ico')) {
      return null;
    }

    return event;
  },

  // Enable SDK logs to help with diagnosing setup in production
  _experiments: {
    enableLogs: true,
  },
  enableLogs: true,
});
