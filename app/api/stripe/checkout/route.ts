import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireVerifiedUser } from '@/lib/auth/verify-email-guard';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session in TEST mode
 * // TEST MODE – checkout temporarily enabled for verification
 * 
 * Request body (optional):
 * - plan: 'monthly' | 'yearly' (defaults to 'monthly' if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Enforce email verification
    let user;
    try {
      user = await requireVerifiedUser();
    } catch (error: any) {
      if (error.message === 'UNAUTHENTICATED') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        return NextResponse.json(
          { error: 'EMAIL_NOT_VERIFIED' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body for plan selection
    let plan: 'monthly' | 'yearly' = 'monthly';
    try {
      const body = await request.json();
      if (body.plan === 'yearly') {
        plan = 'yearly';
      }
      // Default to 'monthly' for any other value or if not provided
    } catch {
      // If body parsing fails, default to monthly (backward compatibility)
      plan = 'monthly';
    }
    
    // 3. Initialize Stripe client with TEST secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // 4. Get price ID based on plan selection
    const priceId = plan === 'yearly' 
      ? process.env.STRIPE_PRICE_PRO_YEARLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY;

    if (!priceId) {
      const missingVar = plan === 'yearly' ? 'STRIPE_PRICE_PRO_YEARLY' : 'STRIPE_PRICE_PRO_MONTHLY';
      console.error(`${missingVar} is not set`);
      return NextResponse.json(
        { error: `Stripe price ID not configured for ${plan} plan` },
        { status: 500 }
      );
    }

    // 5. Get site URL for success/cancel redirects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';
    
    // 6. Create Checkout Session in TEST mode
    // TEST MODE – checkout temporarily enabled for verification
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        email: user.email,
        plan: plan, // Store plan selection in metadata
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

