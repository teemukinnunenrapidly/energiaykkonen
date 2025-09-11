import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { calculateHeatPumpSavings } from '@/lib/calculations';
import { sendLeadEmails } from '@/lib/email-service';
import { defaultRateLimiter, securityLogger } from '@/lib/input-sanitizer';
import { pdf } from '@react-pdf/renderer';
import { SavingsReportPDF } from '@/lib/pdf/SavingsReportPDF';
import { processPDFData } from '@/lib/pdf/pdf-data-processor';
import { calculatePDFValues } from '@/lib/pdf-calculations';
import { EmailAttachment } from '@/lib/resend';

// Enhanced rate limiting with security logging
const RATE_LIMIT = 10;

// Create a Supabase admin client for server-side writes (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false'
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP address and user agent for security logging
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Enhanced rate limiting with security logging
    const rateLimit = defaultRateLimiter.check(clientIp);
    if (!rateLimit.allowed) {
      // Log rate limit exceeded event
      securityLogger.log({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        ip: clientIp,
        userAgent,
        details: {
          requestCount: RATE_LIMIT,
          resetTime: new Date(rateLimit.resetTime),
        },
      });

      return NextResponse.json(
        {
          message: 'Too many submissions. Please try again later.',
          status: 'error',
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(
              rateLimit.resetTime / 1000
            ).toString(),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();

    // Minimal validation - just check essential fields exist
    if (!body.neliot || !body.sahkoposti) {
      return NextResponse.json(
        {
          message: 'Missing required fields',
          status: 'error',
          code: 'VALIDATION_ERROR',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate heat pump savings using Card Builder field names
    const calculations = calculateHeatPumpSavings({
      squareMeters: body.neliot,
      ceilingHeight: parseFloat(body.huonekorkeus || '2.5'),
      residents: parseInt(body.henkilomaara || '2'),
      currentHeatingCost: body.vesikiertoinen,
      currentHeatingType: body.lammitysmuoto,
    });

    // Get additional metadata (userAgent already retrieved above)
    const referer = headersList.get('referer') || '';
    const sourcePage = referer || request.nextUrl.origin;

    // Filter out calculated fields that shouldn't be stored in form_data
    const calculatedFieldsToExclude = [
      'annual_savings',
      'five_year_savings',
      'ten_year_savings',
      'payback_period',
      'heat_pump_consumption',
      'heat_pump_cost_annual',
      'annual_energy_need',
      'co2_reduction',
    ];

    // Create a filtered copy of body without calculated fields
    const filteredBody = Object.keys(body).reduce(
      (acc, key) => {
        if (!calculatedFieldsToExclude.includes(key)) {
          acc[key] = body[key];
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Store all form data first
    const formData = {
      // Store only non-calculated form fields
      ...filteredBody,

      // Add metadata
      source_page: sourcePage,
      user_agent: userAgent,
      ip_address: clientIp,
      consent_timestamp: new Date().toISOString(),
    };

    // Calculate all values needed for PDF generation
    const calculationResults = await calculatePDFValues(
      formData,
      body.sessionId || body.session_id
    );

    console.log('📊 Calculation results for PDF:', calculationResults);

    // Prepare data for database insertion - only fixed columns + JSONB
    const leadData = {
      // Only the 5 fixed columns from Card Builder
      nimi: body.nimi || '',
      sahkoposti: body.sahkoposti || '',
      puhelinnumero: body.puhelinnumero || '',
      paikkakunta: body.paikkakunta || '',
      osoite: body.osoite || '',

      // Status field (if it exists in the table)
      status: 'new' as const,

      // Store all form inputs and inline calculations
      form_data: formData,

      // Store calculated values for PDF generation
      calculation_results: calculationResults,
    };

    // Insert lead into Supabase
    const { data: insertedLead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return NextResponse.json(
        {
          message: 'Failed to save lead data',
          status: 'error',
          code: 'DATABASE_ERROR',
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ Lead inserted successfully:', insertedLead.id);

    // Generate PDF savings report
    let pdfAttachment: EmailAttachment | undefined;
    let pdfUrl: string | null = null;
    try {
      console.log('📄 Generating PDF savings report...');

      // Process data for PDF using the new lead-based approach
      const pdfData = await processPDFData(insertedLead);

      // Generate PDF
      const component = React.createElement(SavingsReportPDF, {
        data: pdfData,
      });
      // The pdf() function expects the Document element directly
      const asPdf = pdf(component as any);
      const bufferStream = await asPdf.toBuffer();
      // Convert ReadableStream to Buffer
      const chunks = [];
      for await (const chunk of bufferStream as any) {
        chunks.push(chunk);
      }
      const pdfBuffer = Buffer.concat(chunks);

      // Save PDF to Supabase Storage
      const pdfFileName = `${insertedLead.id}/saastolaskelma-${pdfData.calculationNumber || Date.now()}.pdf`;

      try {
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('lead-pdfs')
          .upload(pdfFileName, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Failed to upload PDF to storage:', uploadError);
        } else {
          console.log('✅ PDF uploaded to storage:', uploadData.path);

          // Get the public URL for the PDF
          const { data: urlData } = supabaseAdmin.storage
            .from('lead-pdfs')
            .getPublicUrl(pdfFileName);

          pdfUrl = urlData.publicUrl;

          // Update the lead with PDF URL in form_data
          const updatedFormData = {
            ...insertedLead.form_data,
            pdf_url: pdfUrl,
            pdf_generated_at: new Date().toISOString(),
          };

          const { error: updateError } = await supabaseAdmin
            .from('leads')
            .update({
              form_data: updatedFormData,
            })
            .eq('id', insertedLead.id);

          if (updateError) {
            console.error('Failed to update lead with PDF URL:', updateError);
          } else {
            console.log('✅ PDF URL saved to lead:', pdfUrl);
          }
        }
      } catch (storageError) {
        console.error('Storage operation failed:', storageError);
      }

      // Create attachment object for email
      pdfAttachment = {
        filename: `saastolaskelma-${pdfData.calculationNumber || Date.now()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      };

      console.log('✅ PDF generated successfully');
    } catch (pdfError) {
      console.error(
        '⚠️ PDF generation failed (continuing without PDF):',
        pdfError
      );
      // Continue without PDF attachment if generation fails
    }

    // Send emails (don't block response on email failures)
    let emailResults = null;
    try {
      const baseUrl = request.nextUrl.origin;
      emailResults = await sendLeadEmails(insertedLead, baseUrl, pdfAttachment);

      if (emailResults.errors.length === 0) {
        console.log('✅ All emails sent successfully');
      } else {
        console.warn('⚠️ Some emails failed:', emailResults.errors);
      }
    } catch (emailError) {
      // Log email errors but don't fail the API response
      console.error('❌ Email sending failed:', emailError);
      emailResults = {
        customerEmail: null,
        salesEmail: null,
        errors: [
          emailError instanceof Error
            ? emailError.message
            : 'Email sending failed',
        ],
      };
    }

    // Return success response with calculation results
    return NextResponse.json(
      {
        message: 'Lead submitted successfully',
        status: 'success',
        leadId: insertedLead.id,
        calculations: {
          annualSavings: calculations.annualSavings,
          fiveYearSavings: calculations.fiveYearSavings,
          tenYearSavings: calculations.tenYearSavings,
          paybackPeriod: calculations.paybackPeriod,
          co2Reduction: calculations.co2Reduction,
        },
        emailResults: emailResults
          ? {
              customerEmailSent: emailResults.customerEmail?.success || false,
              salesEmailSent: emailResults.salesEmail?.success || false,
              emailErrors: emailResults.errors,
            }
          : null,
      },
      {
        status: 201,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in submit-lead API:', error);

    return NextResponse.json(
      {
        message: 'Internal server error',
        status: 'error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
