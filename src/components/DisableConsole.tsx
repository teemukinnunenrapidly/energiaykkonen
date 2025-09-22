'use client';

import { useEffect } from 'react';

/**
 * Disables console output in non-development environments.
 * Keeps the console noisy only during local development.
 */
export default function DisableConsole() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      const noop = () => {};
      // Silence common console methods in production
      // eslint-disable-next-line no-console
      console.log = noop as typeof console.log;
      // eslint-disable-next-line no-console
      console.info = noop as typeof console.info;
      // eslint-disable-next-line no-console
      console.debug = noop as typeof console.debug;
      // eslint-disable-next-line no-console
      console.warn = noop as typeof console.warn;
      // eslint-disable-next-line no-console
      console.error = noop as typeof console.error;
      // eslint-disable-next-line no-console
      console.trace = noop as typeof console.trace;
    }
  }, []);

  return null;
}


