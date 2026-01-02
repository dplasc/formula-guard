# Pricing Presentation — Monthly vs Yearly

This document defines how Pro Monthly and Pro Yearly plans are presented to users on the `/pricing` page.

---

## Goal

The pricing presentation should:
- Make Monthly feel low-risk and accessible
- Make Yearly feel like the smart choice without pressure
- Use clear, honest communication
- Avoid dark patterns (no fake urgency, no hidden costs, no forced selections)

---

## Plan Options

### Two Plans Available

1. **Pro Monthly**
   - Billed monthly
   - Lower upfront commitment
   - Easier to cancel or change

2. **Pro Yearly**
   - Billed annually
   - Lower per-month cost
   - Better value for committed users

### Relative Positioning

- **Yearly appears first** (left side on desktop, top on mobile)
- **Monthly appears second** (right side on desktop, below on mobile)
- Both plans are presented side-by-side with equal visual weight
- Neither plan is visually "pushed" or hidden

### Default Selection

- **No default selection** — user must explicitly choose Monthly or Yearly
- Both options are clearly visible and equally accessible
- User choice is required before proceeding to checkout

### Labels

- **Yearly plan** may include a short label: "Save X%" or "Best value" (only if mathematically justified)
- **Monthly plan** has no label (keeps it neutral and low-pressure)
- Labels are factual and honest, not promotional

---

## Yearly Discount Communication

### Savings Format

- **Primary communication**: Percentage savings (e.g., "Save 20%")
- **Secondary communication**: Equivalent months free (e.g., "2 months free per year")
- Both formats may be shown, but percentage is primary

### Wording Rules

- **Clear and factual**: "Save 20% with yearly billing" (not "Save 20% today!")
- **No urgency**: Avoid "Limited time" or "Act now" language
- **Short and direct**: One sentence maximum per savings message
- **Honest comparison**: Show both monthly and yearly prices clearly

### Example Wording

- "Save 20% with yearly billing"
- "2 months free per year"
- "Best value for yearly commitment"

---

## CTA Behavior

### Free Users

- **CTA text**: "Upgrade to Pro"
- **On click**: User selects Monthly or Yearly, then proceeds to checkout
- **Selection required**: User must choose billing frequency before checkout
- **No pre-selection**: Monthly is not auto-selected to avoid assumptions

### Pro Users

- **CTA text**: "Manage Billing"
- **On click**: Opens billing portal (allows plan changes, cancellation, payment updates)
- **No upgrade prompt**: Pro users see billing management, not upgrade options

---

## Visual Hierarchy

### Plan Cards

- Both plans use the same card design
- Equal visual prominence
- Clear price display for both options
- Feature list is identical (both are Pro plans)

### Savings Highlight

- Yearly savings are shown clearly but not aggressively
- Savings badge or text is visible but not overwhelming
- No flashing, pulsing, or attention-grabbing animations

---

## User Experience Flow

1. User arrives at `/pricing`
2. Both Monthly and Yearly options are visible
3. User reviews both options
4. User clicks on their preferred plan (Monthly or Yearly)
5. User proceeds to checkout with selected billing frequency
6. No hidden steps or forced selections

---

## Principles

- **Transparency**: All costs and billing frequencies are clear upfront
- **Choice**: User has full control over selection
- **Honesty**: Savings claims are accurate and verifiable
- **Respect**: No pressure tactics or manipulation
- **Clarity**: Language is simple and direct

---

*This document defines presentation only. Implementation details are handled separately.*

