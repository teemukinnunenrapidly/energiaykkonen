import { Lead } from './supabase';
import { sendEmail, emailConfig, EmailAttachment } from './resend';
import {
  generateSalesEmailHtml,
  calculateLeadScore,
  emailSubjects,
  getAdminUrl,
  SalesEmailData,
  generateCustomerEmailText,
} from './email-templates';
import { flattenLeadData } from './lead-helpers';

/**
 * Send customer results email with calculation details
 */
export async function sendCustomerResultsEmail(
  lead: Lead,
  pdfAttachment?: EmailAttachment
) {
  try {
    // Flatten lead data to access JSONB fields
    const flatLead = flattenLeadData(lead) as any;
    console.log(`Sending customer results email to ${flatLead.sahkoposti}`);

    // Use hardcoded template
    const subject: string = emailSubjects.customer();

    const text = generateCustomerEmailText();

    // Send email with optional PDF attachment
    const result = await sendEmail({
      to: flatLead.sahkoposti,
      subject,
      text,
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
    });

    return result;
  } catch (error) {
    console.error('Failed to send customer results sahkoposti:', error);
    throw new Error(
      `Customer email failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send sales notification email with lead details
 */
export async function sendSalesNotificationEmail(
  lead: Lead,
  baseUrl?: string,
  pdfAttachment?: EmailAttachment
) {
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
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
    });

    return { ...result, leadScore };
  } catch (error) {
    console.error('Failed to send sales notification sahkoposti:', error);
    throw new Error(
      `Sales email failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send both customer and sales emails
 * This is the main function to call after a lead is submitted
 */
export async function sendLeadEmails(
  lead: Lead,
  baseUrl?: string,
  pdfAttachment?: EmailAttachment
) {
  const results = {
    customerEmail: null as any,
    salesEmail: null as any,
    errors: [] as string[],
  };

  // Send customer email with optional PDF attachment
  try {
    results.customerEmail = await sendCustomerResultsEmail(lead, pdfAttachment);
    console.log('✅ Customer email sent successfully');
  } catch (error) {
    const errorMessage = `Customer email failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌', errorMessage);
    results.errors.push(errorMessage);
  }

  // Send sales notification (attach the same PDF sent to customer)
  try {
    results.salesEmail = await sendSalesNotificationEmail(
      lead,
      baseUrl,
      pdfAttachment
    );
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
    status: 'new',

    // Required fields
    nimi: 'Testi Käyttäjä',
    sahkoposti: testEmail,
    puhelinnumero: '+358401234567',
    osoite: 'Testikatu 1',
    paikkakunta: 'Helsinki',

    // Tracking fields
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Test Browser)',
    source_page: 'https://test.energiaykkonen.fi/calculator',

    // Form data
    form_data: {
      // House Information
      neliot: 120,
      huonekorkeus: 2.5,
      rakennusvuosi: '1991-2010',
      floors: 2,

      // Current Heating
      lammitysmuoto: 'Electric',
      vesikiertoinen: 2500,
      current_energy_consumption: 15000,

      // Household
      henkilomaara: 4,
      hot_water_usage: 'Normal',

      // Preferences
      valittutukimuoto: 'Both',
      message: 'Kiinnostaa lämpöpumppu, ottakaa yhteyttä!',

      // Energy calculations (Finnish shortcodes)
      laskennallinenenergiantarve: 18720,
      menekinhintavuosi: 2500,
    },

    // Calculation results
    calculation_results: {
      annual_energy_need: 18720,
      heat_pump_consumption: 5616,
      heat_pump_cost_annual: 673.92,
      annual_savings: 1826.08,
      five_year_savings: 9130.4,
      ten_year_savings: 18260.8,
      payback_period: 8.22,
      co2_reduction: 3744,
    },
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
