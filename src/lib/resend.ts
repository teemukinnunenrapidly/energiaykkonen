import { Resend } from 'resend';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

export const resend = new Resend(resendApiKey);

// Email configuration
export const emailConfig = {
  // Use onboarding@resend.dev for testing until domain is verified
  from: process.env.NODE_ENV === 'development' 
    ? 'Energiaykkönen Test <onboarding@resend.dev>'
    : 'Energiaykkönen Oy <noreply@energiaykkonen.fi>',
  salesTo: 'sales@energiaykkonen.fi', // Update with actual sales email
  replyTo: 'info@energiaykkonen.fi',
} as const;

// Email attachment type
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

// Email sending wrapper with error handling
export async function sendEmail({
  to,
  subject,
  html,
  from = emailConfig.from,
  replyTo = emailConfig.replyTo,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        content_type: att.contentType,
      })),
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
