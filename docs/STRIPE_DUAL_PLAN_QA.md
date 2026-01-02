# Stripe Dual-Plan QA Checklist

**Time:** 5–7 minutes | **Mode:** TEST | **Purpose:** Verify Monthly and Yearly Pro subscription flows

---

## Preconditions

- Stripe is in TEST mode
- Environment variables set:
  - `STRIPE_PRICE_PRO_MONTHLY` (existing monthly price ID)
  - `STRIPE_PRICE_PRO_YEARLY` (new yearly price ID)
- Use Incognito / private window (to avoid branding cache + session issues)
- User is logged in as Free user (not Pro)

---

## Monthly Checkout Verification

1. Go to `/pricing`
2. Select Monthly plan (or trigger checkout without plan parameter for default behavior)
3. Trigger `POST /api/stripe/checkout` (no body or `{ "plan": "monthly" }`)
4. Verify on Stripe-hosted checkout:
   - Product: **FormulaGuard Pro**
   - Price: **$9.99 / month**
   - Billing interval: **Monthly**
   - Merchant name: **OGLAŠAVAJ SE**
   - No logo / no icon
5. Complete TEST payment (use standard Stripe test card)
6. Verify redirect to `/upgrade/success`
7. Verify user becomes Pro:
   - Wait a few seconds for webhook to process
   - Navigate to `/pricing`
   - Confirm "Upgrade to Pro" button is replaced with "Manage Billing" button

---

## Yearly Checkout Verification

1. Go to `/pricing`
2. Select Yearly plan (or trigger checkout with yearly parameter)
3. Trigger `POST /api/stripe/checkout` with body: `{ "plan": "yearly" }`
4. Verify on Stripe-hosted checkout:
   - Product: **FormulaGuard Pro**
   - Price: **$99.00 / year**
   - Billing interval: **Yearly**
   - Merchant name: **OGLAŠAVAJ SE**
   - No logo / no icon
   - Branding unchanged (same as monthly)
5. Complete TEST payment (use standard Stripe test card)
6. Verify redirect to `/upgrade/success`
7. Verify user becomes Pro (same verification as monthly)

---

## Cancel Path (Both Plans)

For both Monthly and Yearly:

1. Start checkout session (either plan)
2. Cancel out of Stripe checkout
3. Verify redirect to `/upgrade/cancel`
4. Verify no Pro access granted:
   - Return to `/pricing`
   - Confirm "Upgrade to Pro" button is still visible (not replaced by billing portal)

---

## Regression Sanity Checks

- [ ] **Monthly default behavior**: Monthly checkout works when no plan parameter is sent (backward compatibility)
- [ ] **Yearly explicit selection**: Yearly only activates when `{ "plan": "yearly" }` is explicitly sent
- [ ] **No cross-plan confusion**: 
  - Monthly checkout never shows $99.00 / year
  - Yearly checkout never shows $9.99 / month
  - Billing intervals are correct for each plan
- [ ] **Both plans use same product**: Both show "FormulaGuard Pro" as product name
- [ ] **Branding consistency**: Both plans show same merchant name, no logo, no icon

---

## Troubleshooting

- **Wrong price shown** → Check environment variables are set correctly
- **Yearly not working** → Verify `STRIPE_PRICE_PRO_YEARLY` is set and request body includes `{ "plan": "yearly" }`
- **Monthly not working** → Verify `STRIPE_PRICE_PRO_MONTHLY` is set
- **Branding looks stale** → Use incognito window + create new checkout session

---

*This checklist verifies both Monthly and Yearly subscription flows work correctly in TEST mode.*

