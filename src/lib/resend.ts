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
  from: (() => {
    const vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV;
    const defaultProdFrom = 'Energiaykkönen Oy <noreply@energiaykkonen.fi>';
    const defaultDevFrom = 'Energiaykkönen Test <onboarding@resend.dev>';
    // Allow override via env var to unblock sending while domain is being verified
    return (
      process.env.RESEND_FROM ||
      (vercelEnv === 'production' ? defaultProdFrom : defaultDevFrom)
    );
  })(),
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
  text,
  from = emailConfig.from,
  replyTo = emailConfig.replyTo,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}) {
  try {
    if (!html && !text) {
      throw new Error('Either html or text must be provided to sendEmail');
    }
    // Build payload compatible with current Resend SDK; cast to any to satisfy evolving types
    const payload: any = {
      from,
      to,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      replyTo,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        // Resend expects base64 string content. Convert Buffers safely.
        content:
          typeof att.content === 'string'
            ? att.content
            : (att.content as Buffer).toString('base64'),
        // Use contentType key per current SDK expectations
        contentType: att.contentType,
      })),
    };

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      // Improve error reporting so API response isn't just "undefined"
      const anyErr = error as any;
      const msg =
        anyErr?.message || anyErr?.name || anyErr?.type || JSON.stringify(anyErr);
      console.error('Resend error:', anyErr);
      throw new Error(`Email sending failed: ${msg}`);
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
