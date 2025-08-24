import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY!;

if (!resendApiKey) {
  throw new Error('Missing Resend API key');
}

export const resend = new Resend(resendApiKey);

// Email templates for different scenarios
export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

// Send customer results email
export async function sendCustomerResults(
  email: string,
  customerName: string,
  results: {
    annualSavings: number;
    paybackPeriod: number;
    co2Reduction: number;
  }
) {
  const { data, error } = await resend.emails.send({
    from: 'E1 Calculator <noreply@energiaykkonen.fi>',
    to: email,
    subject: 'Your Heat Pump Savings Calculation Results',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">E1 Calculator Results</h1>
        <p>Hello ${customerName},</p>
        <p>Thank you for using our heat pump calculator! Here are your results:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1e40af;">Your Savings</h2>
          <p><strong>Annual Savings:</strong> €${results.annualSavings.toFixed(2)}</p>
          <p><strong>Payback Period:</strong> ${results.paybackPeriod.toFixed(1)} years</p>
          <p><strong>CO2 Reduction:</strong> ${results.co2Reduction.toFixed(0)} kg/year</p>
        </div>
        
        <p>Our sales team will contact you soon to discuss your options.</p>
        <p>Best regards,<br>Energiaykkönen Team</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }

  return data;
}

// Send sales notification email
export async function sendSalesNotification(leadData: {
  name: string;
  email: string;
  phone: string;
  annualSavings: number;
  paybackPeriod: number;
}) {
  const { data, error } = await resend.emails.send({
    from: 'E1 Calculator <noreply@energiaykkonen.fi>',
    to: 'sales@energiaykkonen.fi', // This should be configurable
    subject: 'New Lead: Heat Pump Calculator',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">New Lead Generated</h1>
        <p>A new lead has been generated from the E1 Calculator:</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #991b1b;">Lead Details</h2>
          <p><strong>Name:</strong> ${leadData.name}</p>
          <p><strong>Email:</strong> ${leadData.email}</p>
          <p><strong>Phone:</strong> ${leadData.phone}</p>
          <p><strong>Annual Savings:</strong> €${leadData.annualSavings.toFixed(2)}</p>
          <p><strong>Payback Period:</strong> ${leadData.paybackPeriod.toFixed(1)} years</p>
        </div>
        
        <p>Please contact this lead within 24 hours.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Error sending sales notification: ${error.message}`);
  }

  return data;
}
