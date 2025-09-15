import { NextResponse } from 'next/server';
import { validateEmailConfiguration } from '@/lib/email-config-validator';

export async function GET() {
  try {
    const validation = validateEmailConfiguration();

    return NextResponse.json({
      status: validation.isValid ? 'ready' : 'configuration_needed',
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      timestamp: new Date().toISOString(),
      help: {
        setupGuide: 'EMAIL_SETUP_GUIDE.md',
        testEndpoint: '/api/test-email',
        resendDashboard: 'https://resend.com/dashboard',
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        isValid: false,
        errors: ['Unable to validate email configuration'],
        warnings: [],
        suggestions: ['Check server logs for details'],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
