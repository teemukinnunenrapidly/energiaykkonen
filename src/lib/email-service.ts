import { Lead, supabase } from './supabase';
import { sendEmail, emailConfig, EmailAttachment } from './resend';
import {
  generateCustomerEmailHtml,
  generateSalesEmailHtml,
  calculateLeadScore,
  emailSubjects,
  getAdminUrl,
  CustomerEmailData,
  SalesEmailData,
} from './email-templates';
import { getEmailTemplatesByCategory } from './email-templates-service';
import { UnifiedCalculationEngine } from './unified-calculation-engine';

/**
 * Send customer results email with calculation details
 */
export async function sendCustomerResultsEmail(
  lead: Lead,
  pdfAttachment?: EmailAttachment
) {
  try {
    console.log(`Sending customer results email to ${lead.sahkoposti}`);

    // Try to fetch template from database first
    let html: string;
    let subject: string = emailSubjects.customer();
    
    try {
      // Fetch customer results template from database
      const templates = await getEmailTemplatesByCategory('results');
      
      if (templates && templates.length > 0) {
        // Use the first active template
        const template = templates[0];
        
        // Prepare data for shortcode processing
        const templateData = {
          // Lead data
          first_name: lead.first_name,
          last_name: lead.last_name,
          sahkoposti: lead.sahkoposti,
          puhelinnumero: lead.puhelinnumero,
          osoite: lead.osoite,
          paikkakunta: lead.paikkakunta,
          
          // House data
          neliot: lead.neliot,
          huonekorkeus: lead.huonekorkeus,
          rakennusvuosi: lead.rakennusvuosi,
          floors: lead.floors,
          lammitysmuoto: lead.lammitysmuoto,
          vesikiertoinen: lead.vesikiertoinen,
          current_energy_consumption: lead.current_energy_consumption,
          henkilomaara: lead.henkilomaara,
          hot_water_usage: lead.hot_water_usage,
          
          // Calculations
          annual_energy_need: lead.annual_energy_need,
          heat_pump_consumption: lead.heat_pump_consumption,
          heat_pump_cost_annual: lead.heat_pump_cost_annual,
          annual_savings: lead.annual_savings,
          five_year_savings: lead.five_year_savings,
          ten_year_savings: lead.ten_year_savings,
          payback_period: lead.payback_period,
          co2_reduction: lead.co2_reduction,
          
          // Add PDF attachment note if PDF is attached
          pdf_attachment_note: pdfAttachment 
            ? '<p style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; margin: 16px 0;">📎 <strong>Liite:</strong> Yksityiskohtainen säästöraportti PDF-muodossa on liitteenä tässä sähköpostissa.</p>'
            : ''
        };
        
        // Process shortcodes in template
        const engine = new UnifiedCalculationEngine(
          supabase,
          `email-${Date.now()}`,
          templateData
        );
        
        // Process subject
        const subjectResult = await engine.process(template.subject);
        subject = subjectResult.success && subjectResult.result ? subjectResult.result : template.subject;
        
        // Process content
        const contentResult = await engine.process(template.content);
        html = contentResult.success && contentResult.result ? contentResult.result : template.content;
        
        console.log('✅ Using database template for customer email');
      } else {
        // Fall back to hardcoded template
        console.log('⚠️ No database template found, using hardcoded template');
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
            squareMeters: lead.neliot,
            heatingType: lead.lammitysmuoto,
          },
        };
        html = generateCustomerEmailHtml(emailData);
      }
    } catch (templateError) {
      // If database fetch fails, fall back to hardcoded template
      console.error('Failed to fetch database template:', templateError);
      console.log('⚠️ Falling back to hardcoded template');
      
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
          squareMeters: lead.neliot,
          heatingType: lead.lammitysmuoto,
        },
      };
      html = generateCustomerEmailHtml(emailData);
    }

    // Send email with optional PDF attachment
    const result = await sendEmail({
      to: lead.sahkoposti,
      subject,
      html,
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

    // Contact Info
    first_name: 'Testi',
    last_name: 'Käyttäjä',
    sahkoposti: testEmail,
    puhelinnumero: '+358401234567',
    osoite: 'Testikatu 1',
    paikkakunta: 'Helsinki',
    valittutukimuoto: 'Both',
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
