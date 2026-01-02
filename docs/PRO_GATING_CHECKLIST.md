# Pro Feature Gating Checklist

This document defines the current Pro feature gating behavior in FormulaGuard.

---

## Pro Features Identified

Based on current implementation, the following features are Pro-only:

1. **Save Formula** (to database)
2. **Save As** (duplicate formula)
3. **Dashboard** (`/dashboard` route)
4. **Load from Dashboard** (accessing saved formulas via dashboard)

---

## Feature 1: Save Formula

### Location in UI
- **Builder page** (`/builder`)
- **Actions column** — "Save" button (Cloud icon)

### Free User Experience
- Button is **visible but disabled**
- Tooltip on hover: "Upgrade to the paid plan to enable saving."
- Clicking shows error notification: "Saving formulas is available on the paid plan."
- Upgrade hint displayed below button:
  - Text: "Saving formulas is available on the paid plan. Upgrade to enable Save & Save As."
  - Link to `/pricing`: "View plans"

### Pro User Experience
- Button is **fully enabled**
- Clicking saves formula to database
- Shows "Saving…" state during save
- Shows "Saved ✓" on success
- Displays "Saved at HH:mm" timestamp

---

## Feature 2: Save As

### Location in UI
- **Builder page** (`/builder`)
- **Actions column** — "Save As…" button (FilePlus icon)

### Free User Experience
- Button is **visible but disabled**
- Tooltip on hover: "Upgrade to the paid plan to enable saving."
- Clicking shows error notification: "Saving formulas is available on the paid plan."

### Pro User Experience
- Button is **fully enabled**
- Clicking prompts for new formula name
- Creates duplicate formula in database with new name

---

## Feature 3: Dashboard

### Location in UI
- **Route**: `/dashboard`
- **Navigation**: Accessible via header/navigation (if present)

### Free User Experience
- Route is **accessible** (not blocked by middleware)
- Dashboard page loads but shows empty state if no formulas exist
- `getFormulas()` action will return empty array for free users (no saved formulas)
- Empty state message: "No formulas yet" with "Create New Formula" button

### Pro User Experience
- Route is **fully accessible**
- Shows list of all saved formulas from database
- Each formula shows: name, ingredient count, batch size, last updated date
- Actions available: Open, Delete, Duplicate

---

## Feature 4: Load from Dashboard

### Location in UI
- **Dashboard page** (`/dashboard`)
- Clicking a formula card opens it in builder

### Free User Experience
- Dashboard accessible but shows empty state (no formulas to load)
- Cannot load formulas because cannot save them

### Pro User Experience
- Clicking a formula card navigates to `/formula/[id]` or `/builder` with formula data
- Formula loads with all saved data (ingredients, batch size, procedure, notes, process steps)

---

## Additional UI Indicators

### Builder Page — Free User Hint
- **Location**: Top of builder, below formula name/header
- **Condition**: Shown when `user && !isPaidUser`
- **Content**:
  - Text: "Tip: You can Print/PDF export your formula anytime. Saving & dashboard access are available on Pro."
  - Link to `/pricing`: "View plans"
  - Styling: Gray background, border, info icon

### Pricing Page — Pro Status Indicator
- **Location**: `/pricing` page, upgrade section
- **Free User**: Shows "Upgrade to Pro" button (CheckoutButton)
- **Pro User**: Shows "Manage Billing" button (BillingPortalButton)
- This is the primary visual indicator of Pro status

---

## Edge Cases

### User Upgrades to Pro
- **Current behavior**: Webhook updates `app_metadata.plan` to `'pro'`
- **UI update**: Requires **page refresh** or **re-login** to reflect Pro status
- **Note**: Success page (`/upgrade/success`) suggests waiting a few seconds, then navigating to `/pricing` to verify Pro status
- **Verification**: Pro status is checked via `user?.app_metadata?.plan === 'pro'` which requires fresh session data

### User Downgrades or Subscription Expires
- **Expected behavior** (future): Webhook should update `app_metadata.plan` to `'free'`
- **UI impact**: Save buttons become disabled, dashboard becomes empty (formulas may be retained but not accessible via UI)
- **Note**: Current implementation handles `customer.subscription.deleted` event and sets plan to `'free'`
- **UI update**: Requires page refresh or re-login to reflect Free status

---

## Technical Implementation Notes

### Pro Status Check
- **Canonical check**: `user?.app_metadata?.plan === 'pro'`
- **Client-side**: `useAuth()` hook provides user data
- **Server-side**: `createClient()` from Supabase server utilities

### Save Gating Logic
- **Client-side check**: `if (!isPaidUser)` blocks save action
- **Server-side**: `saveFormula` action does not explicitly check Pro status (relies on RLS/database permissions)
- **Error handling**: Shows notification and returns early if not Pro

### Dashboard Access
- **Route protection**: No middleware blocking `/dashboard`
- **Email verification**: Required via `requireEmailVerification()` in dashboard layout
- **Data access**: `getFormulas()` queries database, returns empty array if no formulas exist (works for both Free and Pro)

---

## Legacy Features (Not Pro-Gated)

The following features are **available to all users** (Free and Pro):

- **Print/PDF Export**: Available to all users
- **Load from localStorage**: "Load" button in builder loads from browser localStorage (legacy, not database-backed)
- **Formula Builder**: All builder features (add ingredients, calculate, compliance checks)
- **Compliance Checks**: EU Annex and IFRA validation

---

*This checklist reflects current behavior as of the last update. It does not include future planned features.*

