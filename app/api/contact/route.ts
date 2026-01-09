import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { sendUserAutoReply } from '@/lib/email/sendUserAutoReply';

// In-memory rate limiting store
// Map<IP, Array<timestamp>>
const rateLimitStore = new Map<string, number[]>();

const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ip) || [];
  
  // Filter out timestamps older than the rate limit window
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  
  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  // Add current timestamp
  recentTimestamps.push(now);
  rateLimitStore.set(ip, recentTimestamps);
  return true; // Allowed
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, subject, message, agreed } = body;

    // Validation errors
    const errors: Record<string, string> = {};

    // Validate email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Email is invalid';
    }

    // Validate subject
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      errors.subject = 'Subject is required';
    } else if (subject.length > 200) {
      errors.subject = 'Subject must be 200 characters or less';
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.message = 'Message is required';
    } else if (message.length > 5000) {
      errors.message = 'Message must be 5000 characters or less';
    }

    // Validate agreed
    if (agreed !== true) {
      errors.agreed = 'You must agree to be contacted';
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(errors, { status: 400 });
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || null;

    // Insert into Supabase using admin client
    const adminClient = createAdminClient();
    const { data: insertData, error: insertError } = await adminClient
      .from('contact_requests')
      .insert({
        name: name || null,
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        agreed: agreed,
        ip: clientIP,
        user_agent: userAgent,
        user_id: null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to insert contact request:', insertError);
      return NextResponse.json(
        { error: 'Failed to save message.' },
        { status: 500 }
      );
    }

    const contactRequestId = insertData?.id || null;

    // Send email notification (non-blocking - Supabase insert already succeeded)
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'FormulaGuard <info@formulaguard.com>',
          to: 'info@formulaguard.com',
          replyTo: email.trim(),
          subject: subject.trim() ? `Contact form: ${subject.trim()}` : 'New message',
          text: `Name: ${name || 'Not provided'}\nEmail: ${email.trim()}\nSubject: ${subject.trim() || 'No subject'}\n\nMessage:\n${message.trim()}`,
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the request since Supabase insert succeeded
      console.error('Failed to send email notification:', emailError);
    }

    // Send auto-reply email to user (non-blocking - Supabase insert already succeeded)
    try {
      await sendUserAutoReply({
        to: email.trim(),
        name: name || null,
      });
    } catch (autoReplyError) {
      // Log error but don't fail the request since Supabase insert succeeded
      console.error('AUTO_REPLY_EMAIL_FAILED', {
        contactRequestId,
        error: autoReplyError,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    // Handle JSON parsing errors or other issues
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

