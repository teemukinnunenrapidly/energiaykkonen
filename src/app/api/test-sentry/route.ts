import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'error';

  try {
    switch (testType) {
      case 'error':
        // Test exception capture
        throw new Error('Test error from Sentry test endpoint');

      case 'message':
        // Test message capture
        Sentry.captureMessage('Test message from Sentry test endpoint', 'info');
        return NextResponse.json({
          success: true,
          message: 'Test message sent to Sentry',
          type: 'message',
        });

      case 'warning':
        // Test warning capture
        Sentry.captureMessage(
          'Test warning from Sentry test endpoint',
          'warning'
        );
        return NextResponse.json({
          success: true,
          message: 'Test warning sent to Sentry',
          type: 'warning',
        });

      case 'breadcrumb':
        // Test breadcrumb
        Sentry.addBreadcrumb({
          message: 'Test breadcrumb from API',
          category: 'api',
          level: 'info',
        });
        Sentry.captureMessage('Test with breadcrumb', 'info');
        return NextResponse.json({
          success: true,
          message: 'Test breadcrumb and message sent to Sentry',
          type: 'breadcrumb',
        });

      case 'user-context':
        // Test with user context
        Sentry.setUser({
          id: 'test-user-123',
          email: 'test@energiaykkonen.fi',
          username: 'test-user',
        });
        Sentry.captureMessage('Test with user context', 'info');
        return NextResponse.json({
          success: true,
          message: 'Test with user context sent to Sentry',
          type: 'user-context',
        });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid test type. Use: error, message, warning, breadcrumb, user-context',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    // This will be captured by Sentry
    console.log('API Error caught, sending to Sentry:', error);
    Sentry.captureException(error, {
      tags: {
        component: 'sentry-test-api',
        testType,
      },
      extra: {
        url: request.url,
        userAgent: request.headers.get('user-agent'),
      },
    });
    
    // Force flush to ensure event is sent
    await Sentry.flush(2000);

    return NextResponse.json({
      success: true,
      message: 'Test error captured by Sentry',
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Test form submission error
    if (body.simulateError) {
      throw new Error('Simulated form submission error');
    }

    // Test successful form with Sentry context
    Sentry.withScope(scope => {
      scope.setTag('component', 'test-form');
      scope.setLevel('info');
      scope.setContext('formData', {
        hasData: !!body.data,
        fieldCount: Object.keys(body.data || {}).length,
      });

      Sentry.captureMessage('Test form submission successful');
    });

    return NextResponse.json({
      success: true,
      message: 'Form submission test completed',
      receivedData: Object.keys(body).length > 0,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'sentry-test-api',
        method: 'POST',
      },
      extra: {
        hasBody: true,
      },
    });

    return NextResponse.json(
      {
        error: 'Form submission test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
