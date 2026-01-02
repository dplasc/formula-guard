# FormulaGuard — QA Checklist

Single source-of-truth manual QA checklist for FormulaGuard production verification.

**CONTEXT**: Production is LIVE. Stability first. This checklist verifies critical paths, expected failures, and release readiness.

---

## 1. Pre-flight (Before Testing)

### Environment Setup
- [ ] **Verify environment variables are set**
  - Steps: Check that Stripe keys, Supabase URLs, and auth secrets are configured
  - Expected: All required env vars present, no missing keys

- [ ] **Verify `/pricing` route has `export const dynamic = 'force-dynamic'`**
  - Steps: Open `app/pricing/page.tsx`, verify line contains: `export const dynamic = 'force-dynamic';`
  - Expected: Line 16 (or equivalent) contains the exact export statement

- [ ] **Verify Stripe Checkout uses POST endpoint (NOT NEXT_PUBLIC_STRIPE_CHECKOUT_URL)**
  - Steps: Search codebase for `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` usage in checkout flow
  - Expected: Checkout flow uses `POST /api/stripe/checkout`, no references to NEXT_PUBLIC_STRIPE_CHECKOUT_URL

- [ ] **Production URL accessible**
  - Steps: Navigate to production URL
  - Expected: Site loads without errors, no 500s

---

## 2. Smoke Tests (Critical Happy Path)

### Authentication Flow
- [ ] **New user signup**
  - Steps: Navigate to `/auth`, sign up with new email, check email for verification
  - Expected: Email received, verification link works, redirects to `/builder` after verification

- [ ] **Existing user login**
  - Steps: Navigate to `/auth`, log in with valid credentials
  - Expected: Redirects to `/builder` (default), session established

- [ ] **Auth callback route**
  - Steps: Log out, log in, observe `/auth/callback` route execution
  - Expected: `/auth/callback` successfully exchanges Supabase code → session, redirects to `/builder`

- [ ] **`?next=` redirect parameter**
  - Steps: Log out, navigate to `/dashboard?next=/builder`, log in
  - Expected: After login, redirects to `/builder` (respects `?next=`)

### Protected Routes
- [ ] **Dashboard access (authenticated)**
  - Steps: Log in, navigate to `/dashboard`
  - Expected: Dashboard loads, shows formula list (or empty state if none)

- [ ] **Builder access (authenticated)**
  - Steps: Log in, navigate to `/builder`
  - Expected: Builder loads, FormulaCalculator component renders

- [ ] **Formula detail access (authenticated)**
  - Steps: Log in, navigate to `/formula/[id]` with valid formula ID
  - Expected: Formula loads, FormulaCalculator renders with formula data

### Formula Builder (Free User)
- [ ] **Create formula (free tier)**
  - Steps: Log in as free user, go to `/builder`, add ingredients, set percentages
  - Expected: Ingredients add successfully, percentages update, total calculates correctly

- [ ] **Builder available for free users**
  - Steps: Verify free user can access `/builder` and use calculator
  - Expected: Builder accessible, calculator functional

### Formula Builder (Pro User)
- [ ] **Save formula (pro tier)**
  - Steps: Log in as pro user, create formula, click "Save"
  - Expected: Save succeeds, feedback shows "Saved ✓", timestamp displayed ("Saved at HH:mm")

- [ ] **Load formula from dashboard**
  - Steps: Pro user, go to `/dashboard`, click on saved formula
  - Expected: Redirects to `/builder` with formula loaded, FormulaCalculator shows saved data

- [ ] **Load formula via direct URL**
  - Steps: Pro user, navigate to `/formula/[id]` directly
  - Expected: Formula loads server-side, FormulaCalculator renders with correct data

- [ ] **RLS enforcement (user sees only own formulas)**
  - Steps: Pro user A saves formula, log in as Pro user B, attempt to access user A's formula ID
  - Expected: Access denied or formula not found (RLS blocks)

### Compliance Checks (Pro Only)
- [ ] **Valid formula saves (pro tier)**
  - Steps: Pro user, create formula with valid percentages (sums to 100%), no violations
  - Expected: Save succeeds, no compliance errors shown

- [ ] **Compliance checks run (pro tier)**
  - Steps: Pro user, create formula, verify compliance logic executes
  - Expected: Compliance checks run, results displayed if violations found

### Payments (Stripe)
- [ ] **Pricing page loads**
  - Steps: Navigate to `/pricing`
  - Expected: Pricing page loads, shows Monthly €9.99, Yearly €99, Yearly is default selected

- [ ] **Checkout flow (Monthly)**
  - Steps: Click "Upgrade" on Monthly plan, complete Stripe Checkout
  - Expected: Redirects to Stripe Checkout, merchant name "OGLAŠAVAJ SE" displayed, no logo/icon, payment succeeds, redirects to success page

- [ ] **Checkout flow (Yearly)**
  - Steps: Click "Upgrade" on Yearly plan, complete Stripe Checkout
  - Expected: Redirects to Stripe Checkout, merchant name "OGLAŠAVAJ SE" displayed, no logo/icon, payment succeeds, redirects to success page

- [ ] **Checkout endpoint**
  - Steps: Monitor network tab when clicking upgrade, verify API call
  - Expected: POST request to `/api/stripe/checkout`, returns redirect URL

- [ ] **Billing portal access**
  - Steps: Pro user, click billing portal button, verify API call
  - Expected: POST request to `/api/stripe/portal`, redirects to Stripe Customer Portal

---

## 3. Negative Tests (Expected Blocks / Failures)

### Authentication Blocks
- [ ] **Protected routes block unauthenticated users**
  - Steps: Log out, attempt to access `/dashboard`, `/builder`, `/formula/[id]`, `/admin`
  - Expected: Redirects to `/auth` (or appropriate auth flow)

- [ ] **Invalid credentials**
  - Steps: Attempt login with incorrect email/password
  - Expected: Error message shown, no session created

### Free Tier Restrictions
- [ ] **Free user cannot save**
  - Steps: Free user, create formula, attempt to save
  - Expected: Save button disabled/hidden, or error message: "Upgrade to Pro to save formulas"

- [ ] **Free user cannot access dashboard**
  - Steps: Free user, attempt to navigate to `/dashboard`
  - Expected: Redirects to upgrade/pricing page, or access denied

- [ ] **Free user cannot load formulas**
  - Steps: Free user, attempt to navigate to `/formula/[id]`
  - Expected: Access denied or redirect to upgrade

- [ ] **Free user cannot export (print/PDF)**
  - Steps: Free user, create formula, attempt to export/print
  - Expected: Export/print button disabled/hidden, or upgrade prompt shown

- [ ] **Free user: no compliance checks**
  - Steps: Free user, create formula with violations (e.g., banned ingredient)
  - Expected: No compliance warnings/errors shown (compliance checks disabled for free)

### Compliance Hard-Fail Blocks (Pro Only)
- [ ] **IFRA violation blocks save (Leave-On)**
  - Steps: Pro user, set product type to "Leave-On", add fragrance ingredient exceeding IFRA max for Leave-On
  - Expected: Save blocked, hard-fail error message shown, unified summary message displayed

- [ ] **IFRA violation blocks save (Rinse-Off)**
  - Steps: Pro user, set product type to "Rinse-Off", add fragrance ingredient exceeding IFRA max for Rinse-Off
  - Expected: Save blocked, hard-fail error message shown, unified summary message displayed

- [ ] **EU Annex II (BANNED) blocks save**
  - Steps: Pro user, add banned ingredient from EU Annex II
  - Expected: Save blocked, hard-fail error message shown, unified summary message lists banned ingredient

- [ ] **EU Annex III (Restricted with numeric max %) blocks save**
  - Steps: Pro user, add restricted ingredient with numeric max % (e.g., 5%), exceed that percentage
  - Expected: Save blocked, hard-fail error message shown, unified summary message lists violation

- [ ] **EU Annex III (Restricted without numeric max %) does NOT block save**
  - Steps: Pro user, add restricted ingredient with text-only restriction (no numeric max %)
  - Expected: Save succeeds (no hard-fail, text-only restrictions not enforced)

- [ ] **Multiple violations show unified message**
  - Steps: Pro user, create formula with IFRA violation + Annex II banned + Annex III exceeded
  - Expected: Save blocked, single unified hard-fail summary message lists ALL violations together

- [ ] **Save button disabled when hard-fails present**
  - Steps: Pro user, create formula with hard-fail violation, attempt to save
  - Expected: Save button disabled or click blocked, error message clearly displayed

### UX Guards
- [ ] **Unsaved changes: browser refresh warning**
  - Steps: Create formula, make changes, attempt to refresh browser (F5 or Ctrl+R)
  - Expected: Browser `beforeunload` warning dialog appears

- [ ] **Unsaved changes: tab/window close warning**
  - Steps: Create formula, make changes, attempt to close tab/window
  - Expected: Browser `beforeunload` warning dialog appears

- [ ] **Unsaved changes: internal navigation confirmation**
  - Steps: Create formula, make changes, click internal link (e.g., to dashboard)
  - Expected: Confirmation dialog appears, "Are you sure? Unsaved changes will be lost"

- [ ] **Delete confirmation (dashboard)**
  - Steps: Pro user, go to dashboard, click delete on formula
  - Expected: Confirmation dialog appears, deletion only proceeds on confirm

- [ ] **Delete confirmation (builder)**
  - Steps: Pro user, in builder with saved formula, click delete
  - Expected: Confirmation dialog appears, deletion only proceeds on confirm

- [ ] **Auto-naming when name is empty**
  - Steps: Create formula, leave name field empty, save
  - Expected: Formula auto-named (e.g., "My New Formula" or timestamp-based)

### Save Feedback States
- [ ] **"Saving…" state**
  - Steps: Pro user, click save, observe button/feedback
  - Expected: Button shows "Saving…" or loading indicator during save

- [ ] **"Saved ✓" state**
  - Steps: Pro user, save succeeds
  - Expected: Button/feedback shows "Saved ✓" after successful save

- [ ] **"Saved at HH:mm" timestamp**
  - Steps: Pro user, save succeeds, observe feedback
  - Expected: Timestamp displayed in format "Saved at HH:mm" (e.g., "Saved at 14:30")

- [ ] **Error state**
  - Steps: Pro user, attempt save with network error or invalid state
  - Expected: Error message shown, save button returns to normal state

### Stripe Webhook
- [ ] **GET /api/stripe/webhook returns 405**
  - Steps: Send GET request to `/api/stripe/webhook`
  - Expected: HTTP 405 Method Not Allowed (expected behavior)

- [ ] **POST /api/stripe/webhook handles events**
  - Steps: Send valid Stripe webhook event (e.g., checkout.session.completed) via POST
  - Expected: Webhook processes event, returns 200 (or appropriate response)

---

## 4. Stripe Regression Mini-Runbook

### Pre-Checkout Verification
- [ ] **Pricing page dynamic export**
  - Steps: Verify `app/pricing/page.tsx` contains `export const dynamic = 'force-dynamic';`
  - Expected: Line present, no syntax errors

- [ ] **Checkout endpoint implementation**
  - Steps: Verify `app/api/stripe/checkout/route.ts` exists, uses POST method
  - Expected: File exists, exports POST handler, creates Stripe Checkout session

- [ ] **Billing portal endpoint implementation**
  - Steps: Verify `app/api/stripe/portal/route.ts` exists, uses POST method
  - Expected: File exists, exports POST handler, creates Stripe billing portal session

- [ ] **Webhook endpoint implementation**
  - Steps: Verify `app/api/stripe/webhook/route.ts` exists, handles POST, returns 405 for GET
  - Expected: File exists, GET returns 405, POST handles Stripe events

### Checkout Flow Regression
- [ ] **Checkout button triggers POST /api/stripe/checkout**
  - Steps: Click upgrade button, monitor network tab
  - Expected: POST request to `/api/stripe/checkout`, NOT direct redirect to NEXT_PUBLIC_STRIPE_CHECKOUT_URL

- [ ] **Stripe Checkout branding: merchant name**
  - Steps: Complete checkout flow, observe Stripe Checkout page
  - Expected: Merchant name displays as "OGLAŠAVAJ SE"

- [ ] **Stripe Checkout branding: no logo**
  - Steps: Complete checkout flow, observe Stripe Checkout page
  - Expected: No logo displayed on checkout page

- [ ] **Stripe Checkout branding: no icon**
  - Steps: Complete checkout flow, observe Stripe Checkout page
  - Expected: No icon displayed on checkout page

- [ ] **Monthly subscription creation**
  - Steps: Complete Monthly (€9.99) checkout
  - Expected: Subscription created in Stripe, user plan updated to 'pro', access granted

- [ ] **Yearly subscription creation**
  - Steps: Complete Yearly (€99) checkout
  - Expected: Subscription created in Stripe, user plan updated to 'pro', access granted

- [ ] **Checkout success redirect**
  - Steps: Complete checkout, observe redirect
  - Expected: Redirects to `/upgrade/success` or appropriate success page

- [ ] **Checkout cancel redirect**
  - Steps: Cancel checkout in Stripe, observe redirect
  - Expected: Redirects to `/upgrade/cancel` or appropriate cancel page

### Billing Portal Regression
- [ ] **Billing portal button triggers POST /api/stripe/portal**
  - Steps: Click billing portal button, monitor network tab
  - Expected: POST request to `/api/stripe/portal`, returns portal URL

- [ ] **Billing portal access**
  - Steps: Pro user, access billing portal
  - Expected: Redirects to Stripe Customer Portal, can manage subscription

- [ ] **Subscription cancellation via portal**
  - Steps: Pro user, cancel subscription in billing portal
  - Expected: Subscription cancelled, user plan reverts (via webhook), access revoked appropriately

- [ ] **Subscription update via portal**
  - Steps: Pro user, change plan (Monthly ↔ Yearly) in billing portal
  - Expected: Plan updated, billing cycle adjusted, webhook processes event

### Webhook Regression
- [ ] **Webhook GET returns 405**
  - Steps: `curl -X GET https://[production-url]/api/stripe/webhook`
  - Expected: HTTP 405 Method Not Allowed

- [ ] **Webhook POST processes checkout.session.completed**
  - Steps: Send test webhook event (checkout.session.completed) to `/api/stripe/webhook`
  - Expected: Webhook processes event, user plan updated, returns 200

- [ ] **Webhook POST processes customer.subscription.updated**
  - Steps: Send test webhook event (customer.subscription.updated) to `/api/stripe/webhook`
  - Expected: Webhook processes event, user plan/sync updated, returns 200

- [ ] **Webhook POST processes customer.subscription.deleted**
  - Steps: Send test webhook event (customer.subscription.deleted) to `/api/stripe/webhook`
  - Expected: Webhook processes event, user plan reverted, returns 200

---

## 5. Release Gate (Definition of Done Checklist)

### Code Quality
- [ ] **No TypeScript errors**
  - Steps: Run `npm run build` or `tsc --noEmit`
  - Expected: Build succeeds, no TypeScript errors

- [ ] **No build errors**
  - Steps: Run `npm run build`
  - Expected: Build completes successfully, no errors

- [ ] **Linter passes (non-blocking warnings acceptable)**
  - Steps: Run `npm run lint`
  - Expected: Linter passes or only non-blocking warnings present

### Critical Paths Verified
- [ ] **Smoke tests passed**
  - Steps: Execute all items in Section 2 (Smoke Tests)
  - Expected: All critical happy path scenarios pass

- [ ] **Negative tests verified**
  - Steps: Execute all items in Section 3 (Negative Tests)
  - Expected: All expected blocks/failures behave correctly

- [ ] **Stripe regression verified**
  - Steps: Execute all items in Section 4 (Stripe Regression Mini-Runbook)
  - Expected: All Stripe flows work correctly, branding correct, webhooks functional

### Production Readiness
- [ ] **Environment variables configured**
  - Steps: Verify all required env vars set in production (Stripe keys, Supabase URLs, auth secrets)
  - Expected: All required vars present, no missing keys

- [ ] **Database migrations applied**
  - Steps: Verify Supabase migrations are applied in production
  - Expected: Database schema matches codebase expectations

- [ ] **RLS policies verified**
  - Steps: Test that users can only access their own formulas
  - Expected: RLS blocks cross-user access, user sees only own formulas

- [ ] **Stripe webhook endpoint configured**
  - Steps: Verify Stripe Dashboard webhook endpoint points to `/api/stripe/webhook`
  - Expected: Webhook URL configured, events selected (checkout.session.completed, customer.subscription.*)

- [ ] **Informational disclaimer present**
  - Steps: Verify disclaimer block is displayed where required
  - Expected: Disclaimer text visible to users

### Documentation
- [ ] **QA checklist updated (this document)**
  - Steps: Review checklist, update if new features/requirements added
  - Expected: Checklist reflects current production state

---

## Notes

- **Free vs Pro**: Free users can use builder for testing/learning only. Free = NO compliance checks, NO print/PDF export, NO save/load, NO dashboard. Pro = full features (compliance, export, save/load, dashboard).

- **Compliance MVP (LOCKED)**: IFRA enforcement depends on productType (Leave-On / Rinse-Off). EU Annex II (BANNED) always hard-fail. EU Annex III (Restricted) hard-fail ONLY if numeric max % exists (no text parsing). Unified hard-fail summary message (single combined message). Save blocked if any hard-fail triggered.

- **Stability Priority**: Production is LIVE. Stability first. Do not change stable flows (auth, save/load, compliance) unless explicitly required.

- **Formula State**: Formula state lives in `FormulaCalculator.tsx`. Save uses Supabase upsert with JSONB payload. Load uses `/formula/[id]` server-side.

- **Default Redirect**: After auth, default redirect is `/builder`. `?next=` parameter supported for custom redirects.

- **Payment Plans**: Monthly €9.99, Yearly €99. Yearly is default selected in UI.

---

*This checklist is the single source-of-truth for manual QA verification. Use before production deploys and feature merges.*
