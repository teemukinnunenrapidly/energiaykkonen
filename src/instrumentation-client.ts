// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://c03e89000c96cdc048fa49b923eb0ce1@o4510062097137664.ingest.de.sentry.io/4510062100480080',

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  beforeSend(event, hint) {
    try {
      const message =
        hint?.originalException instanceof Error
          ? hint.originalException.message
          : String((hint as any)?.originalException || event.message || '');

      // Drop known noisy client-side errors we explicitly guard elsewhere
      if (
        /Cannot assign to read only property 'pushState' of object '#<History>'/i.test(
          message
        )
      ) {
        return null;
      }

      if (
        /Cannot read properties of null \(reading 'getItem'\)/i.test(message)
      ) {
        return null;
      }
    } catch {}
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Mitigate Safari mutation of history methods causing pushState assignment errors
if (typeof window !== 'undefined') {
  try {
    // Accessors only – do not assign to pushState/replaceState
    // Also, add a lightweight global error filter for the specific message
    window.addEventListener('error', e => {
      const msg = String(e?.message || '');
      if (
        /Cannot assign to read only property 'pushState' of object '#<History>'/i.test(
          msg
        )
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      return undefined as unknown as boolean;
    });
  } catch {}
}
