# FormulaGuard Production Launch Checklist

*This checklist is for internal launch verification.*

## 1) Environment Variables (Vercel)

### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, for admin operations)

### Stripe
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (server-side only)
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe Dashboard
- [ ] `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` - Stripe Checkout session URL
- [ ] `NEXT_PUBLIC_SITE_URL` or `SITE_URL` - Production domain URL (for Billing Portal return URL)

### Optional
- [ ] `NEXT_PUBLIC_BLOG_ENABLED` - Blog feature flag (if applicable)

## 2) Cloudflare / Domain

- [ ] DNS records configured correctly (A/CNAME pointing to Vercel)
- [ ] SSL mode set to Full or Full (Strict) recommended
- [ ] Caching rules configured to avoid caching:
  - Auth routes (`/auth/*`)
  - Protected routes (`/builder/*`, `/admin/*`)
  - API routes (`/api/*`)

## 3) Stripe Dashboard Setup

### Webhook Configuration
- [ ] Webhook endpoint created: `https://<domain>/api/stripe/webhook`
- [ ] Webhook secret copied to `STRIPE_WEBHOOK_SECRET` env var
- [ ] Required events enabled:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`

### Billing Portal
- [ ] Billing Portal enabled in Stripe Dashboard (Settings > Billing > Customer portal)
- [ ] Return URL configured to `/pricing` (or verify it matches `NEXT_PUBLIC_SITE_URL/pricing`)

## 4) App Pages / Routing

- [ ] `/pricing` page:
  - [ ] Shows "Upgrade to Pro" button when `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` is set
  - [ ] Shows disabled state with message when env var is missing
  - [ ] Shows "Manage billing" button for paid users (`app_metadata.plan === "pro"`)

- [ ] `/upgrade/success` page:
  - [ ] Renders correctly
  - [ ] "Go to Builder" link includes `?upgraded=1` query param

- [ ] `/upgrade/cancel` page:
  - [ ] Renders correctly
  - [ ] "View plans" link points to `/pricing`

## 5) Smoke Test (Manual)

### Free User Flow
- [ ] Sign in as free user (or create test account)
- [ ] Navigate to `/builder`
- [ ] Verify Save and Save As buttons are disabled
- [ ] Verify upgrade message appears: "Saving formulas is available on the paid plan..."
- [ ] Verify Export/PDF functionality works
- [ ] Verify compliance checks work

### Upgrade Flow
- [ ] Click "Upgrade to Pro" on `/pricing`
- [ ] Complete Stripe Checkout
- [ ] Verify redirect to `/upgrade/success`
- [ ] Click "Go to Builder"
- [ ] Verify "Pro activated ✓" message appears briefly
- [ ] Verify Save and Save As buttons are enabled
- [ ] Verify Save functionality works

### Billing Portal Flow
- [ ] As paid user, navigate to `/pricing`
- [ ] Click "Manage billing"
- [ ] Verify Stripe Billing Portal opens
- [ ] Verify return URL redirects back to `/pricing`

### Subscription Lifecycle (Webhook Testing)
- [ ] Cancel subscription via Stripe Dashboard or Billing Portal
- [ ] Verify `customer.subscription.deleted` webhook fires
- [ ] Verify user's `app_metadata.plan` changes to `"free"` (check via admin tool)
- [ ] Verify Save/Save As buttons become disabled
- [ ] Re-activate subscription (if testing)
- [ ] Verify `customer.subscription.updated` webhook fires
- [ ] Verify plan returns to `"pro"` when status is `active` or `trialing`

## 6) Rollback / Safety

### Stripe Issues
- [ ] If Stripe checkout misbehaves:
  - [ ] Unset `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` in Vercel
  - [ ] Redeploy (checkout button will show disabled state)
  - [ ] Users can still use free features

### Admin Fallback
- [ ] Admin can manually set user plans via `/admin` page:
  - [ ] Navigate to `/admin` (requires `super_admin` role)
  - [ ] Use "User Plan Management" section
  - [ ] Enter user email and click "Set Pro" or "Set Free"
  - [ ] Verify plan updates in user's `app_metadata.plan`

### Monitoring
- [ ] Set up error monitoring for:
  - [ ] Webhook failures (check Stripe Dashboard webhook logs)
  - [ ] API route errors (check Vercel function logs)
  - [ ] User authentication issues

