import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import React from 'react';
import { supabase } from '@/lib/supabase';
import { calculateHeatPumpSavings } from '@/lib/calculations';
import { sendLeadEmails } from '@/lib/email-service';
import { defaultRateLimiter, securityLogger } from '@/lib/input-sanitizer';
import { pdf } from '@react-pdf/renderer';
import { SavingsReportPDF } from '@/lib/pdf/SavingsReportPDF';
import { processPDFData } from '@/lib/pdf/pdf-data-processor';
import { EmailAttachment } from '@/lib/resend';

// Enhanced rate limiting with security logging
const RATE_LIMIT = 10;

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
        { status: 400 }
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

    // Prepare data for database insertion - using JSONB for dynamic fields
    const leadData = {
      // Critical fixed columns (matching actual database column names)
      first_name: body.first_name || body.nimi?.split(' ')[0] || '',
      last_name: body.last_name || body.nimi?.split(' ').slice(1).join(' ') || '',
      s_hk_posti: body.sahkoposti || body.s_hk_posti || '',  // Map to actual column name
      puhelinnumero: body.puhelinnumero || '',
      status: 'new' as const,
      
      // All dynamic form fields go into JSONB
      form_data: {
        // Store email in JSONB too for consistency
        sahkoposti: body.sahkoposti || '',
        
        // Property details
        neliot: parseFloat(body.neliot) || 0,
        huonekorkeus: parseFloat(body.huonekorkeus || '2.5'),
        rakennusvuosi: body.rakennusvuosi || '',
        floors: parseInt(body.floors || '1'),
        henkilomaara: parseInt(body.henkilomaara || '2'),
        hot_water_usage: body.hot_water_usage || '',
        
        // Address details
        osoite: body.osoite || '',
        paikkakunta: body.paikkakunta || '',
        postcode: body.postcode || '',
        
        // Current heating
        lammitysmuoto: body.lammitysmuoto || '',
        vesikiertoinen: parseFloat(body.vesikiertoinen) || 0,
        current_energy_consumption: body.current_energy_consumption,
        
        // Heat pump calculations
        annual_energy_need: calculations.annualEnergyNeed,
        heat_pump_consumption: calculations.heatPumpConsumption,
        heat_pump_cost_annual: calculations.heatPumpCostAnnual,
        annual_savings: calculations.annualSavings,
        five_year_savings: calculations.fiveYearSavings,
        ten_year_savings: calculations.tenYearSavings,
        payback_period: calculations.paybackPeriod,
        co2_reduction: calculations.co2Reduction,
        
        // Other preferences
        valittutukimuoto: body.valittutukimuoto || '',
        message: body.message || '',
        
        // Metadata
        source_page: sourcePage,
        user_agent: userAgent,
        ip_address: clientIp,
        consent_timestamp: new Date().toISOString(),
        
        // Store ALL fields from Card Builder dynamically
        ...Object.fromEntries(
          Object.entries(body).filter(([key]) => 
            !['first_name', 'last_name', 'nimi'].includes(key)
          )
        ),
      },
    };

    // Insert lead into Supabase
    const { data: insertedLead, error: insertError } = await supabase
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
        { status: 500 }
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
      const component = React.createElement(SavingsReportPDF, { data: pdfData });
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
        const { data: uploadData, error: uploadError } = await supabase.storage
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
          const { data: urlData } = supabase.storage
            .from('lead-pdfs')
            .getPublicUrl(pdfFileName);
          
          pdfUrl = urlData.publicUrl;
          
          // Update the lead with PDF URL
          const { error: updateError } = await supabase
            .from('leads')
            .update({ 
              pdf_url: pdfUrl,
              pdf_generated_at: new Date().toISOString()
            })
            .eq('id', insertedLead.id);
          
          if (updateError) {
            console.error('Failed to update lead with PDF URL:', updateError);
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
      console.error('⚠️ PDF generation failed (continuing without PDF):', pdfError);
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
      { status: 500 }
    );
  }
}
