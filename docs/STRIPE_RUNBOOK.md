# Stripe Regression Mini-Runbook (Production)

**Purpose**: Verify Stripe integration in production after deployments, code changes, or configuration updates.

**When to run**: Before/after any Stripe-related changes, before major releases, after environment variable updates, or when investigating payment issues.

---

## 1. Pre-flight Checks

- [ ] **Verify production environment**
  - Steps: Confirm you are testing against production URL, not staging/test environment
  - Expected: Production URL loads, Stripe keys are LIVE keys

- [ ] **Verify pricing page loads**
  - Steps: Navigate to `/pricing`
  - Expected: Page loads, shows Monthly €9.99 and Yearly €99, Yearly is default selected

- [ ] **Verify checkout endpoint exists**
  - Steps: Confirm `app/api/stripe/checkout/route.ts` exists and exports POST handler
  - Expected: File exists, exports `export async function POST`

- [ ] **Verify billing portal endpoint exists**
  - Steps: Confirm `app/api/stripe/portal/route.ts` exists and exports POST handler
  - Expected: File exists, exports `export async function POST`

- [ ] **Verify webhook endpoint exists**
  - Steps: Confirm `app/api/stripe/webhook/route.ts` exists
  - Expected: File exists, handles POST requests

- [ ] **Verify environment variables**
  - Steps: Check that STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY are set
  - Expected: All required Stripe environment variables configured

---

## 2. Checkout Test (Happy Path)

- [ ] **Monthly checkout flow**
  - Steps: Go to `/pricing`, select Monthly plan, click "Upgrade to Pro", complete Stripe Checkout with test card
  - Expected: Redirects to Stripe Checkout, merchant name "OGLAŠAVAJ SE" displayed, no logo/icon, price shows €9.99/month, payment succeeds, redirects to success page

- [ ] **Yearly checkout flow**
  - Steps: Go to `/pricing`, select Yearly plan (should be default), click "Upgrade to Pro", complete Stripe Checkout with test card
  - Expected: Redirects to Stripe Checkout, merchant name "OGLAŠAVAJ SE" displayed, no logo/icon, price shows €99/year, payment succeeds, redirects to success page

- [ ] **Checkout endpoint called correctly**
  - Steps: Open browser DevTools Network tab, click upgrade button, observe API call
  - Expected: POST request to `/api/stripe/checkout` with plan in body, returns JSON with `url` field

- [ ] **Checkout branding verification**
  - Steps: On Stripe Checkout page, verify merchant name and absence of logo/icon
  - Expected: Merchant name shows "OGLAŠAVAJ SE", no logo visible, no icon visible

- [ ] **Checkout cancel redirect**
  - Steps: Start checkout, click cancel/back on Stripe Checkout page
  - Expected: Redirects to `/pricing` or cancel page, no subscription created

---

## 3. Upgrade Verification in App

- [ ] **Pro status activated after checkout**
  - Steps: Complete checkout, wait 5-10 seconds, navigate to `/pricing`
  - Expected: "Upgrade to Pro" button replaced with "Manage Billing" button (BillingPortalButton visible)

- [ ] **Pro features accessible**
  - Steps: Pro user, navigate to `/dashboard`, attempt to save formula, attempt to export/print
  - Expected: Dashboard loads, save button works, export/print functions work

- [ ] **User plan metadata updated**
  - Steps: Check user metadata in Supabase (via admin or logs)
  - Expected: User `app_metadata.plan` is set to `'pro'`, `app_metadata.stripe_customer_id` is set

---

## 4. Billing Portal Test

- [ ] **Billing portal button visible (Pro users)**
  - Steps: Pro user, navigate to `/pricing`
  - Expected: "Manage Billing" button (BillingPortalButton) visible, "Upgrade to Pro" button NOT visible

- [ ] **Billing portal endpoint called correctly**
  - Steps: Pro user, open DevTools Network tab, click "Manage Billing" button
  - Expected: POST request to `/api/stripe/portal`, returns JSON with `url` field

- [ ] **Billing portal access**
  - Steps: Pro user, click "Manage Billing", observe redirect
  - Expected: Redirects to Stripe Customer Portal, subscription details visible

- [ ] **Subscription management in portal**
  - Steps: In Stripe Customer Portal, verify subscription details, payment method, billing history
  - Expected: Subscription shows correct plan (Monthly/Yearly), correct price, payment method visible, billing history accessible

---

## 5. Webhook Sanity Check

- [ ] **GET /api/stripe/webhook returns 405**
  - Steps: `curl -X GET https://[production-url]/api/stripe/webhook` or test via browser/Postman
  - Expected: HTTP 405 Method Not Allowed (this is expected behavior)

- [ ] **Webhook endpoint processes events**
  - Steps: Check Stripe Dashboard → Webhooks → Latest events, verify recent checkout.session.completed events
  - Expected: Webhook receives events, returns 200 responses (check Stripe webhook logs)

- [ ] **Webhook updates user plan**
  - Steps: Complete checkout, wait 10-15 seconds, check user plan in Supabase
  - Expected: User plan updated to 'pro' within 15 seconds of checkout completion (webhook processed)

---

## 6. Rollback / STOP Conditions

**STOP IMMEDIATELY if any of the following occur:**

- [ ] **Checkout fails to create session**
  - Steps: Monitor for 500 errors when clicking upgrade
  - Expected: Checkout session created successfully
  - **STOP IF**: 500 error, missing environment variables, Stripe API errors

- [ ] **Checkout redirects to wrong URL**
  - Steps: Verify redirect URL after clicking upgrade
  - Expected: Redirects to Stripe Checkout (checkout.stripe.com)
  - **STOP IF**: Redirects to wrong domain, 404 errors, incorrect checkout URL

- [ ] **Branding incorrect on checkout**
  - Steps: Verify merchant name and logo/icon on Stripe Checkout page
  - Expected: Merchant name "OGLAŠAVAJ SE", no logo, no icon
  - **STOP IF**: Wrong merchant name, logo/icon present, branding incorrect

- [ ] **Webhook returns errors**
  - Steps: Check Stripe Dashboard → Webhooks → Latest events, look for failed deliveries
  - Expected: Webhooks return 200, no signature verification failures
  - **STOP IF**: 400/500 responses, signature verification failures, repeated webhook failures

- [ ] **User plan not updated after payment**
  - Steps: Complete checkout, wait 30 seconds, verify user plan
  - Expected: User plan updated to 'pro' within 30 seconds
  - **STOP IF**: Plan not updated, user remains on free plan after successful payment

- [ ] **Billing portal inaccessible**
  - Steps: Pro user, attempt to access billing portal
  - Expected: Billing portal loads, subscription visible
  - **STOP IF**: 404/500 errors, portal fails to load, customer not found errors

**Rollback Procedure:**
1. Revert code changes (git revert/deploy previous version)
2. Verify environment variables unchanged
3. Check Stripe Dashboard for failed payments/subscriptions
4. Manually update affected user plans if needed (via Supabase admin)
5. Document incident and root cause

---

**IMPORTANT NOTES:**
- Production is LIVE. Test carefully with real payments only when necessary.
- Use Stripe test mode for initial verification when possible.
- Monitor Stripe Dashboard for errors during testing.
- Check Vercel logs for server-side errors.
- Verify webhook deliveries in Stripe Dashboard → Webhooks.

---

*Last updated: Production runbook. Run before/after Stripe-related changes.*

