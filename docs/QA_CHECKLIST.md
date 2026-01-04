# FormulaGuard — Pre-Deploy QA Checklist

Quick pre-deployment verification checklist for FormulaGuard. For detailed Stripe testing, see `docs/STRIPE_RUNBOOK.md`.

---

## Auth & Account

- [ ] **User signup and login works**
  - New user can sign up, verify email, and log in successfully
  - Existing user can log in and establish session

- [ ] **Protected routes enforce authentication**
  - `/dashboard` and `/builder` redirect to `/auth` when unauthenticated
  - Authenticated users can access protected routes

- [ ] **Auth callback handles redirects**
  - `/auth/callback` processes Supabase auth code correctly
  - Redirects to `/builder` or respects `?next=` parameter

---

## Builder (Save/Load/Open)

- [ ] **Save formula (Pro users)**
  - Pro user can create formula and save successfully
  - Save feedback shows "Saved ✓" with timestamp

- [ ] **Load formula from dashboard**
  - Clicking saved formula in dashboard opens it in builder
  - Formula data loads correctly (ingredients, percentages, batch size)

- [ ] **Open formula via direct URL**
  - `/formula/[id]` loads formula server-side
  - FormulaCalculator renders with correct data

---

## Dashboard (List/Duplicate/Delete)

- [ ] **Formula list displays**
  - Dashboard shows all saved formulas for current user
  - Empty state shown when no formulas exist

- [ ] **Duplicate formula works**
  - Duplicate action creates a copy with "(Copy)" suffix
  - New formula appears in list

- [ ] **Delete formula works**
  - Delete action requires confirmation
  - Formula removed from list after deletion

---

## Billing (Stripe)

> **Detailed Stripe tests:** See `docs/STRIPE_RUNBOOK.md` for comprehensive checklist.

- [ ] **Pricing page configuration**
  - `/pricing` uses `export const dynamic = 'force-dynamic'`
  - Pricing page loads and displays plans correctly

- [ ] **Checkout flow**
  - Checkout is via POST `/api/stripe/checkout` (not NEXT_PUBLIC_STRIPE_CHECKOUT_URL)
  - Clicking "Upgrade" redirects to Stripe Checkout successfully

- [ ] **Stripe Checkout branding**
  - Merchant name displays as "OGLAŠAVAJ SE"
  - No logo/icon shown on Stripe checkout page

- [ ] **Webhook endpoint**
  - GET `/api/stripe/webhook` returns 405 (expected)
  - Webhook processes payment events and updates user plan

- [ ] **Billing portal access**
  - Pro users can access billing portal via "Manage Billing" button
  - Portal redirects to Stripe Customer Portal correctly

---

## Compliance (EU/IFRA Basic Sanity)

- [ ] **EU Annex II banned ingredients block save**
  - Adding banned ingredient shows error
  - Save button disabled when banned ingredient present

- [ ] **IFRA limits enforced by product type**
  - Leave-On products check Leave-On IFRA limits
  - Rinse-Off products check Rinse-Off IFRA limits

- [ ] **Compliance warnings display**
  - Safety warnings shown for violations
  - Hard-fail errors prevent save, warnings do not

---

## Deploy Sanity (Smoke)

- [ ] **Production build succeeds**
  - `npm run build` completes without errors
  - No TypeScript compilation errors

- [ ] **Core pages load**
  - Home page, pricing page, and auth page load without 500 errors
  - Authenticated users can access dashboard and builder

---

*This checklist covers critical paths. For comprehensive testing, refer to detailed QA documentation.*
