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

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to test connection',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Test your Supabase connection and verify environment variables are
            set correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testConnection}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing Connection...' : 'Test Supabase Connection'}
          </Button>

          {result && (
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
                {result.success ? '✅ Success' : '❌ Failed'}
              </h3>
              <p
                className={`mt-2 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </p>
              {result.error && (
                <p className="mt-2 text-red-600 text-sm font-mono">
                  Error: {result.error}
                </p>
              )}
              {result.timestamp && (
                <p className="mt-2 text-gray-500 text-sm">
                  Tested at: {new Date(result.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Create a Supabase project at{' '}
                <a
                  href="https://supabase.com"
                  className="text-blue-600 hover:underline"
                >
                  supabase.com
                </a>
              </li>
              <li>Copy your project URL and anon key from Settings → API</li>
              <li>
                Create a{' '}
                <code className="bg-gray-100 px-1 rounded">.env.local</code>{' '}
                file with your credentials
              </li>
              <li>Restart your development server</li>
              <li>Click the test button above</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
