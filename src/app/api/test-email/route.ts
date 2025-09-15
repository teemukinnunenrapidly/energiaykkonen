import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmails } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    // Get test email from query params
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';

    // Send test emails
    const results = await sendTestEmails(testEmail);

    return NextResponse.json({
      success: true,
      message: 'Test emails completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: 'Test email failed',
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email address is required',
        },
        { status: 400 }
      );
    }

    // Send test emails
    const results = await sendTestEmails(email);

    return NextResponse.json({
      success: true,
      message: 'Test emails sent successfully',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: 'Test email failed',
        error: e instanceof Error ? e.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
