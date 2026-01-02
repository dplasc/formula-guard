import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session in TEST mode
 * // TEST MODE – checkout temporarily enabled for verification
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (optional for checkout, but recommended)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Initialize Stripe client with TEST secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // 3. Get site URL for success/cancel redirects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';
    
    // 4. Create Checkout Session in TEST mode
    // TEST MODE – checkout temporarily enabled for verification
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'FormulaGuard Pro',
              description: 'Pro plan with save/load formulas and dashboard management',
            },
            unit_amount: 999, // $9.99 in cents (TEST mode)
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      customer_email: user?.email || undefined, // Pre-fill email if user is authenticated
      metadata: {
        user_id: user?.id || '',
        email: user?.email || '',
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

