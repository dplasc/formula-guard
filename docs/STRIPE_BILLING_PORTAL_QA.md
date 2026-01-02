# Stripe Billing Portal QA Checklist

**Time:** 3–5 minutes | **Mode:** TEST | **Purpose:** Verify Billing Portal access and subscription management

---

## Preconditions

- Stripe is in TEST mode
- User is Pro (active subscription — Monthly or Yearly)
- Billing Portal is enabled in Stripe Dashboard (Settings > Billing > Customer portal)
- User is logged in to FormulaGuard
- Billing Portal accessed via `POST /api/stripe/portal`

---

## Access Verification

1. From the app, navigate to `/pricing`
2. Verify "Manage Billing" button is visible (not "Upgrade to Pro")
3. Click "Manage Billing" button
4. Verify redirect to Stripe Billing Portal (Stripe-hosted page)
5. Verify correct customer account is shown:
   - Email matches logged-in user
   - Customer ID matches stored `stripe_customer_id` in user metadata (if available)

---

## Subscription Details

Verify that the portal shows:

- **Product**: FormulaGuard Pro
- **Current plan**: Monthly or Yearly (matches subscription)
- **Price**: 
  - Monthly: $9.99 / month
  - Yearly: $99.00 / year
- **Billing interval**: Monthly or Yearly (matches plan)
- **Next billing date**: Correct future date
- **Status**: Active (or appropriate status)

---

## Plan Management

Verify user can:

- **Switch plans** (Monthly ↔ Yearly):
  - If Stripe settings allow plan changes
  - See proration behavior clearly (Stripe-handled, shows credit/charge)
  - Confirm plan change
- **Cancel subscription**:
  - Option to cancel is visible (if Stripe settings allow)
  - Cancel confirmation flow works
  - Understand cancellation terms (access until period end)

**Note**: Plan switching and cancellation availability depends on Stripe Billing Portal configuration in Dashboard.

---

## Cancel & Return

1. Cancel subscription in Stripe Billing Portal
2. Verify return to app:
   - Redirects to `/pricing` (return URL)
   - App loads without errors
3. Document expected app behavior after cancellation:
   - User retains Pro access until subscription period ends
   - Webhook (`customer.subscription.deleted`) will fire at period end
   - App will downgrade user to Free after period end (via webhook)
   - User sees "Manage Billing" button until period end
   - After downgrade, user sees "Upgrade to Pro" button

---

## Sanity & Constraints

### Expectations

- **Portal behavior is Stripe-controlled**: App does not control what options are shown in portal
- **App must not break if plan is changed**: 
  - User can switch Monthly ↔ Yearly in portal
  - App continues to work regardless of plan
  - Pro status is maintained (both plans are Pro)
- **No immediate UI crashes after return**:
  - App handles return from portal gracefully
  - No JavaScript errors in console
  - Page loads correctly
- **Customer ID lookup**:
  - Portal API finds customer by email or stored `stripe_customer_id`
  - Falls back to email lookup if stored ID is invalid
  - Stores customer ID in user metadata for future use

### Error Handling

- **No customer found**: Returns 404 with clear error message
- **Unauthorized**: Returns 401 if user is not authenticated
- **Missing email**: Returns 400 if user has no email
- **Stripe API errors**: Returns 500 with generic error message (logs details server-side)

---

## Troubleshooting

- **"Manage Billing" button not visible** → Verify user is Pro (`app_metadata.plan === 'pro'`)
- **Portal fails to open** → Check Stripe Dashboard: Billing Portal must be enabled
- **Wrong customer shown** → Verify email matches, check customer ID in user metadata
- **Plan switch not available** → Check Stripe Billing Portal settings (plan changes may be disabled)
- **Return URL broken** → Verify `NEXT_PUBLIC_SITE_URL` or `SITE_URL` is set correctly

---

*This checklist verifies Billing Portal functionality. Portal behavior is controlled by Stripe Dashboard settings.*

