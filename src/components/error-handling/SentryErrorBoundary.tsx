'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  tags?: Record<string, string>;
  level?: 'error' | 'warning' | 'info';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SentryErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture the error in Sentry with additional context
    Sentry.withScope(scope => {
      // Add custom tags if provided
      if (this.props.tags) {
        Object.entries(this.props.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Set error level
      scope.setLevel(this.props.level || 'error');

      // Add React error info as context
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });

      // Add error boundary specific tags
      scope.setTag('errorBoundary', 'SentryErrorBoundary');
      scope.setTag('component', 'client');

      Sentry.captureException(error);
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error caught by SentryErrorBoundary:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;

      if (Fallback) {
        return (
          <Fallback error={this.state.error} resetError={this.resetError} />
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Jotain meni vikaan
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Pahoittelut, sovelluksessa tapahtui odottamaton virhe. Virhe on
                raportoitu automaattisesti ja korjaamme sen mahdollisimman pian.
              </p>
              <div className="mt-6">
                <button
                  onClick={this.resetError}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Yritä uudelleen
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SentryErrorBoundary;
