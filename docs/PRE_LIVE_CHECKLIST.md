# Pre-Live Checklist — Stripe LIVE Mode Activation

**Purpose:** Final verification before switching Stripe from TEST to LIVE mode  
**Status:** ⬜ PASS | ⬜ BLOCKED  
**Date:** _______________  
**Reviewed by:** _______________

---

## 1. Technical Readiness

### Production Build
- [ ] Production build passes (`npm run build` succeeds)
- [ ] No TypeScript errors in production build
- [ ] No ESLint blocking errors
- [ ] All routes compile successfully

### Route Verification
- [ ] `/pricing` route loads correctly
- [ ] `/api/stripe/checkout` route is accessible
- [ ] `/api/stripe/webhook` route is accessible
- [ ] `/api/stripe/portal` route is accessible
- [ ] No 500 errors in production logs

### Stripe API Keys
- [ ] **TEST keys** are currently active (verified in code)
- [ ] **LIVE keys** are prepared but NOT yet active
- [ ] Key separation is clear:
  - `STRIPE_SECRET_KEY` (currently TEST, will switch to LIVE)
  - `STRIPE_WEBHOOK_SECRET` (currently TEST, will switch to LIVE)
  - `STRIPE_PRICE_PRO_MONTHLY` (TEST price ID, LIVE price ID ready)
  - `STRIPE_PRICE_PRO_YEARLY` (TEST price ID, LIVE price ID ready)

### Webhook Endpoint
- [ ] Webhook endpoint exists: `POST /api/stripe/webhook`
- [ ] Webhook is reachable in production (tested with Stripe CLI or Dashboard)
- [ ] Webhook signature verification works
- [ ] Webhook handles all required events:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`

---

## 2. Product & UX Readiness

### Documentation
- [ ] Free vs Pro definition exists: `docs/FREE_VS_PRO.md`
- [ ] Pricing presentation defined: `docs/PRICING_PRESENTATION.md`
- [ ] Pro gating behavior documented: `docs/PRO_GATING_CHECKLIST.md`
- [ ] QA checklists are complete and verified

### Pricing Page
- [ ] `/pricing` page exists and loads correctly
- [ ] Free plan features are accurately listed
- [ ] Pro plan features are accurately listed
- [ ] Pricing reflects intended UX (even if UI polish comes later)
- [ ] No misleading pricing or copy
- [ ] No false feature claims

### User Experience
- [ ] Free users see "Upgrade to Pro" button
- [ ] Pro users see "Manage Billing" button
- [ ] Checkout flow is clear and functional
- [ ] Success/cancel pages work correctly

---

## 3. Stripe Readiness

### Products & Prices (LIVE Mode)
- [ ] Product "FormulaGuard Pro" exists in LIVE Stripe Dashboard
- [ ] Monthly price exists in LIVE ($9.99/month) — Price ID documented
- [ ] Yearly price exists in LIVE ($99.00/year) — Price ID documented
- [ ] Both prices are attached to same product
- [ ] Prices are NOT yet used in code (TEST prices still active)

### Billing Portal
- [ ] Billing Portal is enabled in LIVE Stripe Dashboard
- [ ] Portal settings reviewed:
  - Plan switching allowed/disabled (as intended)
  - Cancellation allowed/disabled (as intended)
  - Return URL configured correctly
- [ ] Portal branding reviewed (merchant name, logo settings)

### Webhook Configuration
- [ ] Webhook endpoint configured in LIVE Stripe Dashboard
- [ ] LIVE webhook secret is prepared (not yet in code)
- [ ] Webhook events subscribed:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`
- [ ] Webhook endpoint URL is production URL

### Email & Invoices
- [ ] Email receipts settings reviewed in Stripe Dashboard
- [ ] Invoice settings reviewed
- [ ] Email templates reviewed (if customized)
- [ ] Merchant name "OGLAŠAVAJ SE" is correct in Stripe settings

---

## 4. Legal & Trust Basics

### Required Pages
- [ ] Terms of Service page exists: `/terms`
- [ ] Privacy Policy page exists: `/privacy`
- [ ] Legal/Impressum page exists: `/legal` (EU requirement)
- [ ] Contact page exists: `/contact`

### Content Verification
- [ ] Terms of Service are current and accurate
- [ ] Privacy Policy covers data collection and Stripe payment processing
- [ ] Legal/Impressum includes required EU information:
  - Business name: OGLAŠAVAJ SE, obrt za marketinške usluge
  - Owner: Darko Plašć
  - Address: Ivana Dončevića 7, 43000 Bjelovar, Croatia
  - OIB: 98808078966
- [ ] No false compliance claims
- [ ] No misleading legal statements

### Trust Indicators
- [ ] Pricing is transparent (no hidden fees)
- [ ] Refund/cancellation policy is clear (if applicable)
- [ ] Contact information is accessible

---

## 5. Rollback Plan

### Disable LIVE Payments
- [ ] **Method 1**: Revert environment variables to TEST keys
  - Set `STRIPE_SECRET_KEY` back to TEST key
  - Set `STRIPE_WEBHOOK_SECRET` back to TEST secret
  - Set price IDs back to TEST price IDs
  - Redeploy application
- [ ] **Method 2**: Disable checkout in code (if needed)
  - Add feature flag to disable checkout
  - Show maintenance message on `/pricing`

### Revert to TEST Mode
- [ ] Document exact steps to revert:
  1. Update Vercel environment variables
  2. Redeploy application
  3. Verify TEST mode is active
  4. Test checkout with TEST card

### Decision Authority
- [ ] **Go/No-Go Decision Maker**: _______________
- [ ] **Backup Decision Maker**: _______________
- [ ] **Technical Lead**: _______________
- [ ] Decision process documented

---

## 6. Final Verification

### Pre-Activation
- [ ] All items above are checked
- [ ] TEST mode checkout still works (final verification)
- [ ] All QA checklists have been run and passed
- [ ] Team is notified of LIVE activation plan

### Activation Steps (When Ready)
1. [ ] Update environment variables in Vercel:
   - `STRIPE_SECRET_KEY` → LIVE secret key
   - `STRIPE_WEBHOOK_SECRET` → LIVE webhook secret
   - `STRIPE_PRICE_PRO_MONTHLY` → LIVE monthly price ID
   - `STRIPE_PRICE_PRO_YEARLY` → LIVE yearly price ID
2. [ ] Redeploy application
3. [ ] Verify LIVE checkout works (test with real card, then refund)
4. [ ] Monitor webhook logs for first LIVE transactions
5. [ ] Verify Pro access is granted correctly

---

## Checklist Status

**Overall Status:** ⬜ PASS | ⬜ BLOCKED

**Blocking Issues:**
- _________________________________________________
- _________________________________________________
- _________________________________________________

**Notes:**
- _________________________________________________
- _________________________________________________

**Signed off by:**
- **PM:** _______________ Date: _______
- **Tech Lead:** _______________ Date: _______
- **Stripe Admin:** _______________ Date: _______

---

*This checklist must be completed and signed off before activating Stripe LIVE mode.*

