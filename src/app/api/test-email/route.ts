import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmails } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    // Get test email from query params
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';

    console.log(`🧪 Testing email functionality with: ${testEmail}`);

    // Send test emails
    const results = await sendTestEmails(testEmail);

    return NextResponse.json({
      success: true,
      message: 'Test emails completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test email error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Test email failed',
        error: error instanceof Error ? error.message : 'Unknown error',
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

    console.log(`🧪 Testing email functionality with: ${email}`);

    // Send test emails
    const results = await sendTestEmails(email);

    return NextResponse.json({
      success: true,
      message: 'Test emails sent successfully',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test email error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Test email failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
