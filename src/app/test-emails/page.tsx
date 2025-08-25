'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TestResult {
  success: boolean;
  message: string;
  results?: any;
  testEmail?: string;
  timestamp?: string;
  instructions?: {
    checkInbox?: string;
  };
}

export default function TestEmailsPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const checkEmailConfig = async () => {
    setLoadingConfig(true);
    setConfigStatus(null);

    try {
      const response = await fetch('/api/email-status');
      const data = await response.json();
      setConfigStatus(data);
    } catch {
      setConfigStatus({
        status: 'error',
        isValid: false,
        errors: ['Failed to check configuration'],
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const runTest = async (mode: 'smoke' | 'full') => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email-suite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, mode }),
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        message: 'Test failed',
        testEmail: email,
      });
    } finally {
      setLoading(false);
    }
  };

  const runSmokeTest = () => runTest('smoke');
  const runFullTest = () => runTest('full');

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Testing Dashboard</h1>
        <p className="text-gray-600">
          Test the email delivery system for the Heat Pump Calculator. This page
          helps you verify that emails are being sent correctly.
        </p>
      </div>

      {/* Configuration Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Email Configuration Status</CardTitle>
          <CardDescription>
            Check if your email system is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={checkEmailConfig}
            disabled={loadingConfig}
            variant="outline"
            className="mb-4"
          >
            {loadingConfig ? 'Checking...' : 'Check Configuration'}
          </Button>

          {configStatus && (
            <div
              className={`p-4 rounded-lg border ${
                configStatus.isValid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3
                className={`font-semibold ${
                  configStatus.isValid ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {configStatus.isValid
                  ? '✅ Configuration Valid'
                  : '❌ Configuration Issues'}
              </h3>

              {configStatus.errors && configStatus.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-700 font-medium">Errors:</p>
                  <ul className="text-red-600 text-sm ml-4">
                    {configStatus.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {configStatus.warnings && configStatus.warnings.length > 0 && (
                <div className="mt-2">
                  <p className="text-yellow-700 font-medium">Warnings:</p>
                  <ul className="text-yellow-600 text-sm ml-4">
                    {configStatus.warnings.map(
                      (warning: string, index: number) => (
                        <li key={index}>• {warning}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {configStatus.suggestions &&
                configStatus.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-blue-700 font-medium">Suggestions:</p>
                    <ul className="text-blue-600 text-sm ml-4">
                      {configStatus.suggestions.map(
                        (suggestion: string, index: number) => (
                          <li key={index}>• {suggestion}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Testing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Email Testing</CardTitle>
          <CardDescription>
            Send test emails to verify the customer results and sales
            notification emails are working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Test Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-gray-500">
              Test emails will be sent to this address. Check both inbox and
              spam folder.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={runSmokeTest}
              disabled={loading || !email}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Testing...' : 'Quick Test (2 emails)'}
            </Button>

            <Button
              onClick={runFullTest}
              disabled={loading || !email}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Full Test Suite (8+ emails)'}
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <strong>Quick Test:</strong> Sends one customer email and one
              sales email
            </p>
            <p>
              <strong>Full Test Suite:</strong> Comprehensive testing with
              multiple scenarios
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Results from the email test run</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3
                className={`font-semibold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success ? '✅ Test Passed' : '❌ Test Failed'}
              </h3>
              <p
                className={`mt-2 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </p>

              {result.instructions?.checkInbox && (
                <p className="mt-2 text-blue-700 font-medium">
                  📧 {result.instructions.checkInbox}
                </p>
              )}

              {result.results && result.results.testType === 'full' && (
                <div className="mt-4 text-sm">
                  <p>
                    <strong>Test Summary:</strong>
                  </p>
                  <ul className="ml-4 mt-1">
                    <li>Total Tests: {result.results.totalTests}</li>
                    <li>✅ Passed: {result.results.passed}</li>
                    <li>❌ Failed: {result.results.failed}</li>
                    <li>⏱️ Duration: {result.results.duration}ms</li>
                  </ul>

                  {result.results.failed > 0 && result.results.results && (
                    <div className="mt-3">
                      <p className="font-medium text-red-700">Failed Tests:</p>
                      <ul className="ml-4 text-red-600">
                        {result.results.results
                          .filter((r: any) => !r.passed)
                          .map((r: any, index: number) => (
                            <li key={index}>
                              • {r.testName}: {r.error}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {result.timestamp && (
                <p className="mt-2 text-gray-500 text-sm">
                  Tested at: {new Date(result.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to configure email delivery for the Heat Pump Calculator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Required Setup:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Create a Resend account at{' '}
                <a
                  href="https://resend.com"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  resend.com
                </a>
              </li>
              <li>Generate an API key in your Resend dashboard</li>
              <li>
                Add{' '}
                <code className="bg-gray-100 px-1 rounded">
                  RESEND_API_KEY=re_your_key_here
                </code>{' '}
                to your{' '}
                <code className="bg-gray-100 px-1 rounded">.env.local</code>{' '}
                file
              </li>
              <li>Restart your development server</li>
              <li>Run the configuration check above</li>
              <li>Test with your email address</li>
            </ol>

            <h4 className="font-semibold mt-4 mb-2">For Production:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Verify your domain in Resend</li>
              <li>
                Update email addresses in{' '}
                <code className="bg-gray-100 px-1 rounded">
                  src/lib/resend.ts
                </code>
              </li>
              <li>Set up proper DNS records (SPF, DKIM, DMARC)</li>
              <li>Monitor delivery rates in Resend dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
