'use client';

import React, { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import {
  captureException,
  captureMessage,
  trackFormError,
  addBreadcrumb,
} from '@/lib/sentry-utils';

export default function TestSentryPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testClientError = () => {
    try {
      throw new Error('Test client-side error from test page');
    } catch (error) {
      captureException(error as Error, {
        tags: { component: 'sentry-test-page', testType: 'client-error' },
      });
      addResult('Client error captured');
    }
  };

  const testClientMessage = () => {
    captureMessage('Test client-side message from test page', {
      level: 'info',
      tags: { component: 'sentry-test-page', testType: 'client-message' },
    });
    addResult('Client message sent');
  };

  const testFormError = () => {
    const mockError = new Error('Simulated form validation error');
    trackFormError('test-form', mockError, {
      field1: 'test-value',
      field2: 'another-value',
    });
    addResult('Form error tracked');
  };

  const testBreadcrumbs = () => {
    addBreadcrumb('User clicked test button', 'ui', 'info', {
      buttonType: 'breadcrumb-test',
    });
    addBreadcrumb('Processing breadcrumb test', 'process', 'debug');
    captureMessage('Test message with breadcrumbs');
    addResult('Message with breadcrumbs sent');
  };

  const testApiError = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-sentry?type=error');
      const result = await response.json();
      addResult(`API test completed: ${result.message}`);
    } catch (error) {
      addResult(`API test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testApiMessage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-sentry?type=message');
      const result = await response.json();
      addResult(`API message test: ${result.message}`);
    } catch (error) {
      addResult(`API message test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserContext = () => {
    Sentry.setUser({
      id: 'test-user-456',
      email: 'test@example.com',
      username: 'test-user-client',
    });
    captureMessage('Test with user context from client');
    addResult('User context set and message sent');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sentry Error Tracking Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test various Sentry error tracking and monitoring features. Check
            your Sentry dashboard to see the captured events.
          </p>

          {/* Client-side Tests */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Client-side Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testClientError}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Client Error
              </button>
              <button
                onClick={testClientMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Client Message
              </button>
              <button
                onClick={testFormError}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Form Error
              </button>
              <button
                onClick={testBreadcrumbs}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Breadcrumbs
              </button>
              <button
                onClick={testUserContext}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test User Context
              </button>
            </div>
          </div>

          {/* API Tests */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              API Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testApiError}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {isLoading ? 'Testing...' : 'Test API Error'}
              </button>
              <button
                onClick={testApiMessage}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {isLoading ? 'Testing...' : 'Test API Message'}
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Test Results
              </h2>
              <button
                onClick={clearResults}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
              >
                Clear Results
              </button>
            </div>
            <div className="bg-gray-100 rounded-md p-4 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 italic">
                  No test results yet. Click a test button above.
                </p>
              ) : (
                <ul className="space-y-1">
                  {testResults.map((result, index) => (
                    <li key={index} className="text-sm font-mono text-gray-700">
                      {result}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>
                Click the test buttons above to trigger various Sentry events
              </li>
              <li>
                Check your Sentry dashboard at{' '}
                <a
                  href="https://sentry.io"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sentry.io
                </a>
              </li>
              <li>
                Verify that errors, messages, and user context are being
                captured
              </li>
              <li>Test results will appear in the box above</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
