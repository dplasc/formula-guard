# Stripe TEST Regression Runbook

**Time:** 2–3 minutes | **Mode:** TEST | **Purpose:** End-to-end verification of Stripe upgrade flow

---

## A) Preconditions

- Stripe is in TEST mode
- Use Incognito / private window (to avoid branding cache + session issues)
- Ensure you are logged in to FormulaGuard (or include login step if needed)

---

## B) Pricing → Checkout Session

1. Open `/pricing`
2. Confirm it loads and is force-dynamic (note that it is server-rendered and uses `dynamic='force-dynamic'`)
3. Click "Upgrade to Pro"
4. Verify the app triggers Stripe checkout via `POST /api/stripe/checkout` (user observes: redirect to Stripe-hosted checkout page)
5. **IMPORTANT:** Note that old checkout links may cache branding → always create a NEW session by clicking Upgrade again

---

## C) Checkout UI Verification (Branding)

On Stripe-hosted checkout verify:
- No logo
- No icon
- Merchant name shown: **OGLAŠAVAJ SE**
- Product: FormulaGuard Pro
- Price: $9.99 / month (TEST)

---

## D) Cancel Path

1. Cancel out of checkout
2. Verify redirect to `/upgrade/cancel`
3. Confirm no Pro access granted (return to `/pricing` and verify "Upgrade to Pro" button is still visible, not replaced by billing portal)

---

## E) Success Path + Webhook Effect

1. Repeat: start a NEW checkout session (from `/pricing`)
2. Complete a TEST payment (use standard Stripe test card)
3. Verify redirect to `/upgrade/success`
4. Verify the user becomes Pro:
   - Wait a few seconds for webhook to process
   - Navigate to `/pricing`
   - Confirm "Upgrade to Pro" button is replaced with "Manage Billing" button (BillingPortalButton)
   - This indicates Pro status is active

---

## F) Webhook Expectation Sanity

- Browser `GET /api/stripe/webhook` returns 405 (expected)
- Webhook is POST-only and is handled for Stripe events
- **Note:** This is a sanity expectation, not something the user manually "fixes"

---

## G) Troubleshooting

- **Branding looks stale** → incognito + new checkout session
- **Redirect failed** → re-open `/pricing` and retry
- **Success page but not Pro** → wait for webhook effect and refresh once, then re-check
- **If webhook seems broken** → check Vercel logs / Stripe webhook logs (just mention, no deep dive)

---

*This runbook is intended for manual regression testing before any Stripe-related changes.*

