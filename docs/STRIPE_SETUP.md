# Stripe Setup — Monthly and Yearly Plans

This document describes the Stripe configuration required for FormulaGuard Pro subscriptions.

---

## Stripe Dashboard Setup (TEST Mode)

### Step 1: Create Yearly Price

1. Go to Stripe Dashboard → **Products** (TEST mode)
2. Find the existing product: **FormulaGuard Pro**
3. Click **Add another price** (or **Add price** if no prices exist)
4. Configure the new price:
   - **Billing period**: Yearly
   - **Price**: $99.00
   - **Currency**: USD
   - **Recurring**: Yes
5. Save the price
6. **Copy the Price ID** (starts with `price_`)

### Step 2: Locate Monthly Price ID

1. In the same product (**FormulaGuard Pro**)
2. Find the existing monthly price ($9.99 / month)
3. **Copy the Price ID** (starts with `price_`)

---

## Environment Variables

Add the following environment variables to your `.env.local` (local development) and Vercel (production):

```bash
# Stripe Secret Key (TEST mode)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs (TEST mode)
# Both are required - checkout now uses price IDs instead of inline price_data
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
```

### Notes

- Both price IDs must be from the same Stripe product: **FormulaGuard Pro**
- Monthly price: $9.99 / month
- Yearly price: $99.00 / year
- All prices are in TEST mode for now
- Do NOT hardcode price IDs in code — always use environment variables
- **Important**: `STRIPE_PRICE_PRO_MONTHLY` is now required (previously used inline price_data)

---

## Verification

After setup:

1. Monthly checkout should use `STRIPE_PRICE_PRO_MONTHLY`
2. Yearly checkout should use `STRIPE_PRICE_PRO_YEARLY`
3. Default behavior (no plan specified) uses monthly
4. Both plans show correct pricing and billing period in Stripe Checkout

---

*This setup is for TEST mode only. Production setup will follow the same pattern with LIVE mode keys.*

