import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { calculateHeatPumpSavings } from '@/lib/calculations';
import { calculatorFormSchema } from '@/lib/validation';
import { sendLeadEmails } from '@/lib/email-service';
import { defaultRateLimiter, securityLogger } from '@/lib/input-sanitizer';

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

    // Parse and validate request body
    const body = await request.json();

    // Validate form data using enhanced Zod schema with sanitization
    const validationResult = calculatorFormSchema.safeParse(body);

    if (!validationResult.success) {
      // Log validation failure for security monitoring
      securityLogger.log({
        type: 'validation_failed',
        severity: 'low',
        ip: clientIp,
        userAgent,
        details: {
          errors: validationResult.error.issues.map(issue => ({
            path: issue.path,
            message: issue.message,
          })),
          bodyKeys: Object.keys(body || {}),
        },
      });

      return NextResponse.json(
        {
          message: 'Invalid form data',
          status: 'error',
          code: 'VALIDATION_ERROR',
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // Calculate heat pump savings
    const calculations = calculateHeatPumpSavings({
      squareMeters: formData.squareMeters,
      ceilingHeight: parseFloat(formData.ceilingHeight),
      residents: parseInt(formData.residents),
      currentHeatingCost: formData.annualHeatingCost,
      currentHeatingType: formData.heatingType,
    });

    // Get additional metadata (userAgent already retrieved above)
    const referer = headersList.get('referer') || '';
    const sourcePage = referer || request.nextUrl.origin;

    // Prepare data for database insertion
    const leadData = {
      // House Information
      square_meters: formData.squareMeters,
      ceiling_height: parseFloat(formData.ceilingHeight),
      construction_year: formData.constructionYear,
      floors: parseInt(formData.floors),

      // Current Heating
      heating_type:
        formData.heatingType.charAt(0).toUpperCase() +
        formData.heatingType.slice(1), // Capitalize first letter
      current_heating_cost: formData.annualHeatingCost,
      current_energy_consumption: formData.currentEnergyConsumption || null,

      // Household
      residents: parseInt(formData.residents),
      hot_water_usage:
        formData.hotWaterUsage.charAt(0).toUpperCase() +
        formData.hotWaterUsage.slice(1),

      // Contact Information
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email.toLowerCase(),
      phone: formData.phone,
      street_address: formData.streetAddress || null,
      city: formData.city || null,
      contact_preference:
        formData.contactPreference.charAt(0).toUpperCase() +
        formData.contactPreference.slice(1),
      message: formData.message || null,

      // GDPR Compliance
      gdpr_consent: formData.gdprConsent,
      marketing_consent: formData.marketingConsent || false,
      consent_timestamp: new Date().toISOString(),

      // Calculated Values
      annual_energy_need: calculations.annualEnergyNeed,
      heat_pump_consumption: calculations.heatPumpConsumption,
      heat_pump_cost_annual: calculations.heatPumpCostAnnual,
      annual_savings: calculations.annualSavings,
      five_year_savings: calculations.fiveYearSavings,
      ten_year_savings: calculations.tenYearSavings,
      payback_period: calculations.paybackPeriod,
      co2_reduction: calculations.co2Reduction,

      // Lead Management
      status: 'new' as const,

      // Metadata
      ip_address: clientIp,
      user_agent: userAgent,
      source_page: sourcePage,
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

    // Send emails (don't block response on email failures)
    let emailResults = null;
    try {
      const baseUrl = request.nextUrl.origin;
      emailResults = await sendLeadEmails(insertedLead, baseUrl);

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
