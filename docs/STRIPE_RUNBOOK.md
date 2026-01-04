# Stripe Regression Runbook

**Purpose**: Quick verification checklist to ensure Stripe payment integration works correctly after deployments or configuration changes.

**When to use**: Run this checklist before and after any Stripe-related code changes, environment variable updates, or when investigating payment issues.

---

## Preconditions

- Environment variables present: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`
- Production environment is accessible
- Test Stripe cards available for testing

---

## Manual Checks

1. **Pricing page loads**
   - Navigate to `/pricing`
   - Verify page loads without errors, shows pricing options

2. **Checkout opens via POST /api/stripe/checkout**
   - Click "Upgrade to Pro" button
   - Verify redirect to Stripe Checkout page occurs
   - Confirm checkout session is created successfully

3. **Test payment success (test card)**
   - Complete checkout using Stripe test card (4242 4242 4242 4242)
   - Verify payment processes successfully
   - Confirm redirect to success page after payment

4. **Upgrade success page**
   - After successful payment, verify redirect to `/upgrade/success`
   - Confirm success page displays correctly

5. **Customer portal opens**
   - As a Pro user, click "Manage Billing" button
   - Verify redirect to Stripe Customer Portal
   - Confirm subscription details are visible in portal

6. **Webhook endpoint reachable (GET returns 405)**
   - Test `GET /api/stripe/webhook` endpoint
   - Verify it returns HTTP 405 Method Not Allowed (expected behavior)
   - Confirm endpoint is accessible and responding

7. **User plan updated after payment**
   - Complete a test checkout
   - Wait 10-15 seconds for webhook processing
   - Verify user's plan is updated to 'pro' in the application

8. **Billing portal button visible for Pro users**
   - As a Pro user, navigate to pricing page
   - Verify "Manage Billing" button is visible
   - Confirm "Upgrade to Pro" button is not visible

---

## Rollback Procedure

If any check fails:

1. Revert recent code changes or deployment
2. Verify environment variables are correct and unchanged
3. Check Stripe Dashboard for failed transactions or webhook errors
4. Review application logs for errors
5. If user plans are affected, manually update via Supabase admin if needed
6. Document the failure and notify team

---

*Keep this runbook concise and focused on critical smoke tests only.*
