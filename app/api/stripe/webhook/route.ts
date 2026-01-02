import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper function to update Supabase user plan
 */
async function updateUserPlan(email: string, plan: 'pro' | 'free'): Promise<{ success: boolean; error?: string; message?: string }> {
  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Update Supabase user plan
  const adminClient = createAdminClient();

  // Find user by email (case-insensitive)
  const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    console.error('Failed to list users:', listError);
    return {
      success: false,
      error: 'Failed to find user',
    };
  }

  const targetUser = users.users.find(
    (u) => (u.email ?? '').trim().toLowerCase() === normalizedEmail
  );

  if (!targetUser) {
    console.error('User not found for email:', normalizedEmail);
    return {
      success: false,
      error: 'User not found',
    };
  }

  // Check if user already has desired plan (idempotency)
  if (targetUser.app_metadata?.plan === plan) {
    return {
      success: true,
      message: `User already has ${plan} plan`,
    };
  }

  // Update user plan (preserve existing metadata)
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    targetUser.id,
    {
      app_metadata: {
        ...targetUser.app_metadata,
        plan: plan,
      },
    }
  );

  if (updateError) {
    console.error('Failed to update user plan:', updateError);
    return {
      success: false,
      error: 'Failed to update user plan',
    };
  }

  return {
    success: true,
    message: `User plan updated to ${plan}`,
  };
}

/**
 * POST /api/stripe/webhook
 * Stripe webhook handler for checkout and subscription lifecycle events
 * Automatically sets user plan based on payment/subscription status
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get Stripe webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // 2. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // 3. Initialize Stripe client
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // 4. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 5. Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract email from session (prefer customer_details.email, fallback to customer_email or metadata)
      const email =
        session.customer_details?.email ||
        (session.customer_email as string | null) ||
        session.metadata?.email;

      if (!email) {
        console.error('No email found in checkout session', {
          sessionId: session.id,
        });
        return NextResponse.json(
          { error: 'No email found in checkout session' },
          { status: 400 }
        );
      }

      // Extract Stripe customer ID from session
      const customerId = 
        (typeof session.customer === 'string' ? session.customer : session.customer?.id) ||
        session.customer_id ||
        null;

      // Update user plan to pro (and store customer ID if available)
      const normalizedEmail = email.trim().toLowerCase();
      const adminClient = createAdminClient();

      // Find user by email (case-insensitive)
      const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) {
        console.error('Failed to list users:', listError);
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        );
      }

      const targetUser = users.users.find(
        (u) => (u.email ?? '').trim().toLowerCase() === normalizedEmail
      );

      if (!targetUser) {
        console.error('User not found for email:', normalizedEmail);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user already has pro plan (idempotency)
      const alreadyPro = targetUser.app_metadata?.plan === 'pro';
      const hasCustomerId = targetUser.app_metadata?.stripe_customer_id === customerId;

      // Prepare app_metadata update
      const updatedMetadata: Record<string, any> = {
        ...targetUser.app_metadata,
        plan: 'pro',
      };

      // Store customer ID if available and not already stored
      if (customerId && !hasCustomerId) {
        updatedMetadata.stripe_customer_id = customerId;
      }

      // Only update if needed
      if (!alreadyPro || (customerId && !hasCustomerId)) {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          targetUser.id,
          {
            app_metadata: updatedMetadata,
          }
        );

        if (updateError) {
          console.error('Failed to update user plan:', updateError);
          return NextResponse.json(
            { error: 'Failed to update user plan' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: alreadyPro && hasCustomerId 
          ? 'User already has pro plan and customer ID' 
          : 'User plan updated to pro',
        email: normalizedEmail,
        customerIdStored: !!customerId,
      });
    }

    // 6. Handle customer.subscription.deleted event
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      // Get customer ID
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;

      if (!customerId) {
        console.error('No customer ID found in subscription', {
          subscriptionId: subscription.id,
        });
        return NextResponse.json(
          { error: 'No customer ID found in subscription' },
          { status: 400 }
        );
      }

      // Fetch customer to get email
      let customer: Stripe.Customer;
      try {
        customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      } catch (err) {
        console.error('Failed to retrieve customer:', err);
        return NextResponse.json(
          { error: 'Failed to retrieve customer' },
          { status: 500 }
        );
      }

      const email = customer.email;
      if (!email) {
        console.error('No email found for customer', {
          customerId,
        });
        return NextResponse.json(
          { error: 'No email found for customer' },
          { status: 400 }
        );
      }

      // Update user plan to free (subscription deleted)
      const result = await updateUserPlan(email, 'free');

      if (!result.success) {
        if (result.error === 'User not found') {
          return NextResponse.json(
            { error: result.error },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: result.error || 'Failed to update user plan' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message || 'User plan updated to free',
        email: email.trim().toLowerCase(),
      });
    }

    // 7. Handle customer.subscription.updated event
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;

      // Get customer ID
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;

      if (!customerId) {
        console.error('No customer ID found in subscription', {
          subscriptionId: subscription.id,
        });
        return NextResponse.json(
          { error: 'No customer ID found in subscription' },
          { status: 400 }
        );
      }

      // Fetch customer to get email
      let customer: Stripe.Customer;
      try {
        customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      } catch (err) {
        console.error('Failed to retrieve customer:', err);
        return NextResponse.json(
          { error: 'Failed to retrieve customer' },
          { status: 500 }
        );
      }

      const email = customer.email;
      if (!email) {
        console.error('No email found for customer', {
          customerId,
        });
        return NextResponse.json(
          { error: 'No email found for customer' },
          { status: 400 }
        );
      }

      // Determine plan based on subscription status
      // active or trialing -> pro, otherwise -> free
      const plan: 'pro' | 'free' = 
        subscription.status === 'active' || subscription.status === 'trialing' 
          ? 'pro' 
          : 'free';

      // Update user plan
      const result = await updateUserPlan(email, plan);

      if (!result.success) {
        if (result.error === 'User not found') {
          return NextResponse.json(
            { error: result.error },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: result.error || 'Failed to update user plan' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message || `User plan updated to ${plan}`,
        email: email.trim().toLowerCase(),
        subscriptionStatus: subscription.status,
      });
    }

    // 8. Return success for other event types (we only handle specific events)
    return NextResponse.json({
      success: true,
      message: 'Event received but not handled',
      type: event.type,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

