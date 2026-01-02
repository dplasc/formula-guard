import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/stripe/portal
 * Creates a Stripe Billing Portal session for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // 2. Initialize Stripe client
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

    // 3. Check for stored Stripe customer ID first
    const storedCustomerId = user.app_metadata?.stripe_customer_id as string | undefined;
    let customer: Stripe.Customer | null = null;

    if (storedCustomerId) {
      // Use stored customer ID directly
      try {
        customer = await stripe.customers.retrieve(storedCustomerId) as Stripe.Customer;
      } catch (err) {
        // If stored ID is invalid, fall through to email lookup
        console.log('Stored customer ID invalid, falling back to email lookup');
      }
    }

    // 4. If no stored ID or stored ID invalid, find by email
    if (!customer) {
      const normalizedEmail = user.email.trim().toLowerCase();

      // Try using search API first (if available)
      try {
        const searchResults = await stripe.customers.search({
          query: `email:"${normalizedEmail}"`,
          limit: 1,
        });

        if (searchResults.data.length > 0) {
          customer = searchResults.data[0] as Stripe.Customer;
        }
      } catch (searchError) {
        // Fallback to listing customers if search is not available
        console.log('Customer search not available, falling back to list');
      }

      // Fallback: List customers and find by email
      if (!customer) {
        const { data: customers, has_more } = await stripe.customers.list({
          limit: 100,
        });

        if (customers.length > 0) {
          // Find exact email match (case-insensitive)
          customer = customers.find(
            (c) => c.email && c.email.trim().toLowerCase() === normalizedEmail
          ) as Stripe.Customer | undefined || null;
        }

        // If still not found and there might be more, try a few more pages
        if (!customer && has_more) {
          for (let i = 0; i < 3; i++) {
            const { data: moreCustomers, has_more: more } = await stripe.customers.list({
              limit: 100,
              starting_after: customers[customers.length - 1]?.id,
            });

            customer = moreCustomers.find(
              (c) => c.email && c.email.trim().toLowerCase() === normalizedEmail
            ) as Stripe.Customer | undefined || null;

            if (customer || !more) break;
          }
        }
      }

      if (!customer) {
        return NextResponse.json(
          { error: 'Stripe customer not found for this account' },
          { status: 404 }
        );
      }

      // Store customer ID for future use (if not already stored)
      if (customer.id && customer.id !== storedCustomerId) {
        try {
          const adminClient = createAdminClient();
          await adminClient.auth.admin.updateUserById(user.id, {
            app_metadata: {
              ...user.app_metadata,
              stripe_customer_id: customer.id,
            },
          });
        } catch (updateError) {
          // Log but don't fail - customer ID lookup succeeded
          console.error('Failed to store customer ID:', updateError);
        }
      }
    }

    // 5. Create Billing Portal session
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';
    const returnUrl = `${siteUrl}/pricing`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}

