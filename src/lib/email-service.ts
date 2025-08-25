import { Lead } from './supabase';
import { sendEmail, emailConfig } from './resend';
import {
  generateCustomerEmailHtml,
  generateSalesEmailHtml,
  calculateLeadScore,
  emailSubjects,
  getAdminUrl,
  CustomerEmailData,
  SalesEmailData,
} from './email-templates';

/**
 * Send customer results email with calculation details
 */
export async function sendCustomerResultsEmail(lead: Lead) {
  try {
    console.log(`Sending customer results email to ${lead.email}`);

    // Prepare email data
    const emailData: CustomerEmailData = {
      firstName: lead.first_name,
      lastName: lead.last_name,
      calculations: {
        annualSavings: lead.annual_savings,
        fiveYearSavings: lead.five_year_savings,
        tenYearSavings: lead.ten_year_savings,
        paybackPeriod: lead.payback_period,
        co2Reduction: lead.co2_reduction,
      },
      houseInfo: {
        squareMeters: lead.square_meters,
        heatingType: lead.heating_type,
      },
    };

    // Generate HTML content
    const html = generateCustomerEmailHtml(emailData);

    // Send email
    const result = await sendEmail({
      to: lead.email,
      subject: emailSubjects.customer(),
      html,
    });

    return result;
  } catch (error) {
    console.error('Failed to send customer results email:', error);
    throw new Error(
      `Customer email failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send sales notification email with lead details
 */
export async function sendSalesNotificationEmail(lead: Lead, baseUrl?: string) {
  try {
    console.log(`Sending sales notification for lead ${lead.id}`);

    // Calculate lead score
    const leadScore = calculateLeadScore(lead);

    // Prepare email data
    const emailData: SalesEmailData = {
      lead,
      leadScore,
      adminUrl: getAdminUrl(lead.id, baseUrl),
    };

    // Generate HTML content
    const html = generateSalesEmailHtml(emailData);

    // Send email
    const result = await sendEmail({
      to: emailConfig.salesTo,
      subject: emailSubjects.sales(lead),
      html,
    });

    return { ...result, leadScore };
  } catch (error) {
    console.error('Failed to send sales notification email:', error);
    throw new Error(
      `Sales email failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send both customer and sales emails
 * This is the main function to call after a lead is submitted
 */
export async function sendLeadEmails(lead: Lead, baseUrl?: string) {
  const results = {
    customerEmail: null as any,
    salesEmail: null as any,
    errors: [] as string[],
  };

  // Send customer email
  try {
    results.customerEmail = await sendCustomerResultsEmail(lead);
    console.log('✅ Customer email sent successfully');
  } catch (error) {
    const errorMessage = `Customer email failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌', errorMessage);
    results.errors.push(errorMessage);
  }

  // Send sales notification
  try {
    results.salesEmail = await sendSalesNotificationEmail(lead, baseUrl);
    console.log('✅ Sales notification sent successfully');
  } catch (error) {
    const errorMessage = `Sales email failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌', errorMessage);
    results.errors.push(errorMessage);
  }

  return results;
}

/**
 * Test email functionality (for development/testing)
 */
export async function sendTestEmails(testEmail: string = 'test@example.com') {
  console.log('🧪 Sending test emails...');

  // Create a sample lead for testing
  const testLead: Lead = {
    id: 'test-lead-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // House Information
    square_meters: 120,
    ceiling_height: 2.5,
    construction_year: '1991-2010',
    floors: 2,

    // Current Heating
    heating_type: 'Electric',
    current_heating_cost: 2500,
    current_energy_consumption: 15000,

    // Household
    residents: 4,
    hot_water_usage: 'Normal',

    // Contact Info
    first_name: 'Testi',
    last_name: 'Käyttäjä',
    email: testEmail,
    phone: '+358401234567',
    street_address: 'Testikatu 1',
    city: 'Helsinki',
    contact_preference: 'Both',
    message: 'Kiinnostaa lämpöpumppu, ottakaa yhteyttä!',

    // Calculations
    annual_energy_need: 18720,
    heat_pump_consumption: 5616,
    heat_pump_cost_annual: 673.92,
    annual_savings: 1826.08,
    five_year_savings: 9130.4,
    ten_year_savings: 18260.8,
    payback_period: 8.22,
    co2_reduction: 3744,

    // Lead Management
    status: 'new',
    notes: undefined,

    // Metadata
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Test Browser)',
    source_page: 'https://test.energiaykkonen.fi/calculator',
  };

  try {
    const results = await sendLeadEmails(testLead, 'http://localhost:3000');
    console.log('🎉 Test emails completed:', results);
    return results;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    throw error;
  }
}
