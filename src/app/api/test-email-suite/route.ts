import { NextRequest, NextResponse } from 'next/server';
import { runEmailTestSuite, runEmailSmokeTest } from '@/lib/email-test-suite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';
    const mode = searchParams.get('mode') || 'smoke'; // 'smoke' or 'full'

    let results;

    if (mode === 'smoke') {
      const success = await runEmailSmokeTest(testEmail);
      results = {
        testType: 'smoke',
        success,
        message: success ? 'Smoke test passed' : 'Smoke test failed',
      };
    } else {
      const suiteResults = await runEmailTestSuite(testEmail);
      results = {
        testType: 'full',
        success: suiteResults.failed === 0,
        ...suiteResults,
      };
    }

    return NextResponse.json({
      success: results.success,
      message: `${mode} test completed`,
      results,
      testEmail,
      timestamp: new Date().toISOString(),
      instructions: {
        checkInbox: `Check your email inbox and spam folder for test emails sent to ${testEmail}`,
        endpoints: {
          smokeTest: '/api/test-email-suite?mode=smoke&email=your@email.com',
          fullTest: '/api/test-email-suite?mode=full&email=your@email.com',
        },
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: 'Email test suite failed',
        error: e instanceof Error ? e.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, mode = 'smoke' } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email address is required',
        },
        { status: 400 }
      );
    }

    let results;

    if (mode === 'smoke') {
      const success = await runEmailSmokeTest(email);
      results = {
        testType: 'smoke',
        success,
        message: success ? 'Smoke test passed' : 'Smoke test failed',
      };
    } else {
      const suiteResults = await runEmailTestSuite(email);
      results = {
        testType: 'full',
        success: suiteResults.failed === 0,
        ...suiteResults,
      };
    }

    return NextResponse.json({
      success: results.success,
      message: `${mode} test completed`,
      results,
      testEmail: email,
      timestamp: new Date().toISOString(),
      instructions: {
        checkInbox: `Check your email inbox and spam folder for test emails sent to ${email}`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: 'Email test suite failed',
        error: e instanceof Error ? e.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
