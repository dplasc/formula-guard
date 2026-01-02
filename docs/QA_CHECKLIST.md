# FormulaGuard — QA Checklist

This document defines the manual QA checklist for FormulaGuard.
It is intended to ensure production stability, compliance enforcement, and UX correctness.

---

## 1. Auth & Routing

- [ ] Login with valid credentials works
- [ ] Logout clears session and redirects correctly
- [ ] Protected routes are not accessible when logged out:
  - [ ] /dashboard
  - [ ] /builder
  - [ ] /formula/[id]
  - [ ] /admin
- [ ] Redirect after login using `?next=` works as expected
- [ ] Email verification flow functions correctly
- [ ] Auth callback (`/auth/callback`) successfully exchanges code for session

---

## 2. Formula Builder

- [ ] Adding an ingredient updates formula state correctly
- [ ] Removing an ingredient updates formula state correctly
- [ ] Percentage total updates correctly after changes
- [ ] Edge cases:
  - [ ] Total equals exactly 100%
  - [ ] Total below 100%
  - [ ] Total above 100%
- [ ] Unsaved changes guard:
  - [ ] Browser refresh triggers warning
  - [ ] Tab/window close triggers warning
  - [ ] Internal navigation triggers confirmation

---

## 3. Save / Load Formula

- [ ] Save succeeds when formula is valid and compliant
- [ ] Save is blocked when compliance rules fail
- [ ] Clear error message is shown when save is blocked
- [ ] Existing formula loads correctly via `/formula/[id]`
- [ ] Dashboard opens selected formula in builder
- [ ] Formula deletion requires confirmation:
  - [ ] From dashboard
  - [ ] From builder

---

## 4. Compliance (Manual QA)

- [ ] IFRA:
  - [ ] Exceeding IFRA max usage blocks save
  - [ ] Enforcement respects product type (Leave-On / Rinse-Off)

- [ ] EU Annex II (Banned / Prohibited):
  - [ ] Presence of a banned ingredient blocks save

- [ ] EU Annex III (Restricted):
  - [ ] Numeric max percentage exceeded blocks save
  - [ ] No enforcement when numeric max is not defined

- [ ] Multiple violations:
  - [ ] Unified hard-fail summary message is shown
  - [ ] All active violations are listed in one message

---

## 5. UX Feedback

- [ ] Save button shows:
  - [ ] "Saving…" during save
  - [ ] "Saved ✓" on success
  - [ ] Error state on failure
- [ ] "Saved at HH:mm" timestamp updates correctly
- [ ] Formula auto-names when name field is empty
- [ ] User always receives clear feedback for blocked actions

---

## 6. Known Non-Issues / Out of Scope

- [x] ESLint warnings are present but non-blocking
- [x] No automated test framework is implemented yet
- [x] Checklist does not replace automated testing

---

*This checklist is intended for manual QA verification before production deploys and feature merges.*

