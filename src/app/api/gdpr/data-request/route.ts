import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { securityLogger } from '@/lib/input-sanitizer';

/**
 * GDPR Data Request API
 *
 * This endpoint handles GDPR data subject requests:
 * - Data access (export)
 * - Data deletion (right to erasure)
 * - Data rectification
 */

interface DataRequestBody {
  requestType: 'access' | 'deletion' | 'rectification';
  email: string;
  verificationCode?: string;
  newData?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const clientIp =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const body: DataRequestBody = await request.json();
    const { requestType, email, verificationCode, newData } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid email address is required',
        },
        { status: 400 }
      );
    }

    // Log the GDPR request for audit purposes
    securityLogger.log({
      type: 'validation_failed', // Reusing existing type for GDPR requests
      severity: 'low',
      ip: clientIp,
      userAgent,
      details: {
        gdprRequestType: requestType,
        email: email.substring(0, 3) + '***', // Partially masked for logging
        timestamp: new Date().toISOString(),
      },
    });

    switch (requestType) {
      case 'access':
        return handleDataAccess(email);

      case 'deletion':
        return handleDataDeletion(email, verificationCode);

      case 'rectification':
        return handleDataRectification(email, verificationCode, newData);

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid request type. Must be: access, deletion, or rectification',
          },
          { status: 400 }
        );
    }
    } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error processing GDPR request',
      },
      { status: 500 }
    );
  }
}

async function handleDataAccess(email: string) {
  try {
    // Query the lead data using the database function
    const { data, error } = await supabase.rpc('export_lead_data', {
      lead_email: email,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error retrieving data',
        },
        { status: 500 }
      );
    }

    if (!data || (data.error && data.error.includes('No data found'))) {
      return NextResponse.json(
        {
          success: false,
          message: 'No data found for this email address',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data export completed successfully',
      data: data,
      exportDate: new Date().toISOString(),
      retention: {
        description:
          'Your data will be retained according to our privacy policy',
        retentionPeriod: data.metadata?.data_retention_date || 'Not specified',
        canRequestDeletion: true,
      },
    });
    } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing data access request',
      },
      { status: 500 }
    );
  }
}

async function handleDataDeletion(email: string, verificationCode?: string) {
  // In a production system, you would:
  // 1. Send a verification email first
  // 2. Require the user to confirm deletion via email link
  // 3. Only then proceed with deletion

  // For demonstration, we'll require a simple verification code
  if (!verificationCode || verificationCode !== 'DELETE_MY_DATA') {
    return NextResponse.json({
      success: false,
      message:
        'Data deletion requires verification. Please contact privacy@energiaykkonen.fi for verification code.',
      verificationRequired: true,
      instructions:
        'For security, data deletion requires email verification. Please contact our privacy team.',
    });
  }

  try {
    // Use the database function to delete data
    const { data: deleted, error } = await supabase.rpc('delete_lead_data', {
      lead_email: email,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error processing deletion request',
        },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No data found for this email address or data already deleted',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Your personal data has been permanently deleted from our systems',
      deletionDate: new Date().toISOString(),
      confirmationId: `DEL_${Date.now()}`,
    });
    } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing data deletion request',
      },
      { status: 500 }
    );
  }
}

async function handleDataRectification(
  email: string,
  verificationCode?: string,
  newData?: Record<string, any>
) {
  // Similar verification process as deletion
  if (!verificationCode || verificationCode !== 'UPDATE_MY_DATA') {
    return NextResponse.json({
      success: false,
      message:
        'Data rectification requires verification. Please contact privacy@energiaykkonen.fi',
      verificationRequired: true,
    });
  }

  if (!newData || Object.keys(newData).length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: 'New data is required for rectification',
      },
      { status: 400 }
    );
  }

  try {
    // First check if lead exists
    const { data: existingLead, error: queryError } = await supabase
      .from('leads')
      .select('id, email, anonymized')
      .eq('email', email)
      .eq('anonymized', false)
      .single();

    if (queryError || !existingLead) {
      return NextResponse.json(
        {
          success: false,
          message: 'No data found for this email address',
        },
        { status: 404 }
      );
    }

    // Sanitize and validate the new data
    const allowedFields = [
      'first_name',
      'last_name',
      'phone',
      'street_address',
      'city',
      'contact_preference',
      'message',
      'marketing_consent',
    ];

    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(newData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid fields provided for update',
        },
        { status: 400 }
      );
    }

    // Add update timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the lead data
    const { error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', existingLead.id);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error updating data',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your personal data has been updated successfully',
      updatedFields: Object.keys(updateData).filter(
        key => key !== 'updated_at'
      ),
      updateDate: new Date().toISOString(),
    });
    } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing data rectification request',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GDPR Data Request API',
    description: 'Submit POST requests to exercise your data protection rights',
    availableRequests: {
      access: 'Request a copy of your personal data',
      deletion: 'Request deletion of your personal data',
      rectification: 'Request correction of your personal data',
    },
    contact: {
      privacy: 'privacy@energiaykkonen.fi',
      dataProtectionOfficer: 'dpo@energiaykkonen.fi',
    },
    examples: {
      dataAccess: {
        method: 'POST',
        body: {
          requestType: 'access',
          email: 'your.email@example.com',
        },
      },
      dataDeletion: {
        method: 'POST',
        body: {
          requestType: 'deletion',
          email: 'your.email@example.com',
          verificationCode: 'DELETE_MY_DATA', // Obtained from privacy team
        },
      },
    },
  });
}
