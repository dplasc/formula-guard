import { Resend } from 'resend';

/**
 * Sends an automatic "thank you" reply email to a user after they submit a contact form.
 * 
 * @param to - The recipient email address
 * @param name - Optional name for personalization (falls back to "there" if missing/empty)
 * @throws Error if Resend API key is missing or email send fails
 */
export async function sendUserAutoReply({
  to,
  name,
}: {
  to: string;
  name?: string | null;
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const resend = new Resend(resendApiKey);
  
  // Use "there" as fallback if name is missing or empty
  const displayName = name?.trim() || 'there';
  const greeting = `Hi ${displayName},`;
  
  const subject = 'We\u2019ve received your message – FormulaGuard';
  
  const textBody = `${greeting}

Thanks for reaching out to FormulaGuard.

We\u2019ve received your message and our team will review it shortly.
You can expect a response within 1–2 business days.

If you need to add more details, feel free to reply directly to this email.

Best regards,
FormulaGuard Team
www.formulaguard.com`;

  const htmlBody = `<p>${greeting}</p>

<p>Thanks for reaching out to FormulaGuard.</p>

<p>We\u2019ve received your message and our team will review it shortly.<br />
You can expect a response within 1–2 business days.</p>

<p>If you need to add more details, feel free to reply directly to this email.</p>

<p>Best regards,<br />
FormulaGuard Team<br />
<a href="https://www.formulaguard.com">www.formulaguard.com</a></p>`;

  await resend.emails.send({
    from: 'FormulaGuard <info@formulaguard.com>',
    to,
    replyTo: 'info@formulaguard.com',
    subject,
    text: textBody,
    html: htmlBody,
  });
}
