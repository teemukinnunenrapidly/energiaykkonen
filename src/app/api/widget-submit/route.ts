import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendLeadEmails } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    // Verify the request is from WordPress plugin
    const secret = req.headers.get('X-Widget-Secret');
    if (secret !== process.env.WIDGET_SECRET_KEY) {
      console.error('❌ Unauthorized widget submission attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { formData, calculations, emailTemplate } = await req.json();

    // Validate required fields
    if (!formData || !formData.sahkoposti) {
      return NextResponse.json(
        { error: 'Missing required form data' },
        { status: 400 }
      );
    }

    // Save to Supabase (credentials secure in backend)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        form_data: formData,
        calculations: calculations,
        email_template: emailTemplate,
        source: 'wordpress_widget',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (leadError) {
      console.error('❌ Failed to save lead:', leadError);
      throw leadError;
    }

    console.log('✅ Widget submission saved to Supabase:', lead.id);

    // Send confirmation and sales notification emails
    try {
      const baseUrl = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const emailResults = await sendLeadEmails(lead, baseUrl);
      
      if (emailResults.errors.length > 0) {
        console.error('⚠️ Some emails failed:', emailResults.errors);
      } else {
        console.log('✅ All emails sent successfully');
      }
    } catch (emailError) {
      console.error('⚠️ Email sending failed (lead saved):', emailError);
      // Don't fail the whole submission if email fails
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: 'Form submitted successfully'
    });

  } catch (error) {
    console.error('❌ Widget submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Widget-Secret',
    },
  });
}