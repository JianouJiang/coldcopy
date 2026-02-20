# ColdCopy P0 Manual Testing Checklist

**Purpose:** UI and user experience verification that cannot be automated
**Platform:** Browser-based (Chrome, Firefox, Safari, Edge)
**Devices:** Desktop, iPad, iPhone

---

## P0-1: Happy Path (UI)

### Form Submission
- [ ] **Field labels visible** — All 7 form fields clearly labeled
- [ ] **Placeholders helpful** — Example text in input fields (if any)
- [ ] **Form fits on screen** — No horizontal scrolling on mobile
- [ ] **Input feels responsive** — Typing doesn't lag
- [ ] **Character counter visible** (if implemented) — Shows remaining chars

### Generate Button
- [ ] **Button visible and clickable** — High contrast, at least 44px height
- [ ] **Button shows loading state** — Spinner/disabled while generating
- [ ] **Button text clear** — "Generate Emails" or similar
- [ ] **Button remains disabled** — Until all required fields filled
- [ ] **Mobile-friendly tap target** — No accidental mis-clicks

### Email Output Display
- [ ] **7 emails displayed** — Numbered 1-7
- [ ] **Email cards readable** — Clear separation between emails
- [ ] **Subject lines visible** — Both A/B variants shown
- [ ] **Email body readable** — Full body text visible (scrollable if needed)
- [ ] **Personalization tokens clear** — [Name], [Company] etc. visible to user
- [ ] **Copy button works** — Can copy individual emails to clipboard
- [ ] **Toast notification appears** — "Copied!" feedback when copying

### Mobile Responsiveness
- [ ] **Form stacks vertically** — On iPhone SE (375px width)
- [ ] **Buttons full width** — On mobile devices
- [ ] **Email cards responsive** — Readable on iPhone 6/7/8 (375px)
- [ ] **Text size reasonable** — No font smaller than 14px
- [ ] **No horizontal scroll** — All content fits in viewport

---

## P0-2: Rate Limiting (Paywall UX)

### First Generation
- [ ] **Success message shown** — "Your 7-email sequence is ready!"
- [ ] **Emails visible immediately** — No refresh needed
- [ ] **Success feedback provided** — Toast, color change, or similar

### Second Generation (Rate Limited)
- [ ] **Paywall appears** — UI shows "Quota exceeded" message
- [ ] **Paywall message clear** — "You've used your free generation. Upgrade to continue."
- [ ] **CTA button visible** — "Upgrade" or "View Plans" button
- [ ] **Upgrade flow works** — Clicking CTA goes to payment page
- [ ] **No error messages** — 402 response handled gracefully (not visible as error)
- [ ] **Form still filled** — User data not lost when quota hit

### Payment Link Integration
- [ ] **Payment page loads** — After clicking "Upgrade"
- [ ] **Pricing clear** — Shows subscription cost
- [ ] **Payment methods available** — Credit card, Apple Pay, etc.
- [ ] **Cancel button accessible** — User can go back to app
- [ ] **Success page after payment** — Confirms subscription activated
- [ ] **Can generate again** — After payment, quota is reset (or increased)

---

## P0-3: Form Validation (Client + Server)

### Empty Form Submission
- [ ] **Error message shown** — "Please fill in all fields" or similar
- [ ] **Missing fields highlighted** — Red border or error icon
- [ ] **Error text specific** — Not just "Error" but "Company name required"
- [ ] **Form not submitted** — No API call made to backend
- [ ] **Error message disappears** — When user fills in field

### Partial Form Submission
- [ ] **Only required fields enforced** — All 7 fields are required (verify)
- [ ] **Clear error for each field** — "Job title required", "Problem statement required"
- [ ] **User can correct one field at a time** — Doesn't need to fill all at once

### Character Limit Warnings (Client-Side)
- [ ] **Character counter visible** (if implemented) — "45/50 characters"
- [ ] **Visual warning at limit** — Color change when approaching max
- [ ] **Cannot exceed limit** — Input stops accepting characters (or server rejects)

---

## P0-4: Character Limits (Server Handling)

### Long Company Name
- [ ] **Accepts long names** — Over 50 characters
- [ ] **Generates valid emails** — With full company name or truncated appropriately
- [ ] **No truncation visible to user** — Unless intentional

### Long Problem Statement
- [ ] **Accepts long descriptions** — 200+ characters
- [ ] **Claude incorporates details** — Email body references the problem

### Special Characters
- [ ] **Handles apostrophes** — "O'Neill" doesn't break
- [ ] **Handles quotes** — Double quotes, single quotes
- [ ] **Handles ampersands** — "Smith & Associates"
- [ ] **Handles accented characters** — "Café", "Zürich"

---

## P0-5: Session Persistence

### Across Page Refresh
- [ ] **Session cookie persists** — After page refresh, same session
- [ ] **Generated emails still visible** — After refresh
- [ ] **Quota state persisted** — Can't generate again after refresh
- [ ] **No "session expired" messages** — Unless genuinely expired (90+ days)

### Browser Tabs
- [ ] **New tab = new session** — Opening app in new tab creates new session
- [ ] **Same tab preserved** — Refreshing same tab keeps session
- [ ] **Two independent quotas** — Tab A has 1 free gen, Tab B has 1 free gen (separate sessions)

### Different Devices
- [ ] **Different device = different session** — Desktop and mobile are independent
- [ ] **No cross-device tracking** — (Privacy by design — good for MVP)

---

## P0-X: Additional Quality Checks

### Browser Compatibility
- [ ] **Chrome/Chromium** — Latest version
- [ ] **Firefox** — Latest version
- [ ] **Safari** — Latest on macOS and iOS
- [ ] **Edge** — Latest version
- [ ] **Mobile browsers** — iOS Safari, Chrome on Android

### Performance
- [ ] **Page load fast** — Initial load under 3 seconds
- [ ] **Form interaction responsive** — Typing, clicking feels instant
- [ ] **Email generation feedback** — Loading spinner visible, not frozen
- [ ] **Email cards scroll smoothly** — No jank on mobile

### Accessibility
- [ ] **Keyboard navigation works** — Tab through form fields
- [ ] **Screen reader compatible** — Form labels readable
- [ ] **Color contrast sufficient** — Text legible (WCAG AA standard)
- [ ] **Focus visible** — Clear focus rings on buttons/inputs
- [ ] **No keyboard traps** — Can exit any element with Tab

### Error Messages
- [ ] **Errors are user-friendly** — Not technical jargon
- [ ] **Errors are actionable** — Tell user how to fix
- [ ] **No console errors** — Browser dev tools show no JS errors
- [ ] **No uncaught promises** — All async errors handled

### Visual Polish
- [ ] **Colors professional** — Consistent with brand
- [ ] **Typography readable** — Good font choices, sizes
- [ ] **Icons clear** — If used, icons are intuitive
- [ ] **Spacing balanced** — Not cramped or sparse
- [ ] **No visual bugs** — Misaligned text, overlapping elements, etc.

---

## Testing Schedule

**Recommended:** Before enabling payment links, spend 1-2 hours on:
1. **Desktop testing** (Chrome, Firefox, Safari) — 45 min
2. **Mobile testing** (iPhone, Android) — 30 min
3. **Payment flow testing** — 15 min (after Stripe integration)

**Estimated Total:** 2 hours of manual testing

---

## Sign-Off

| Item | Status | Notes |
|------|--------|-------|
| Automated tests (API) | ✅ PASS | See `coldcopy-day4-test-results.md` |
| Manual UI tests | ⏳ PENDING | Run before public launch |
| Payment flow tested | ⏳ PENDING | After Stripe integration |
| Mobile testing | ⏳ PENDING | Recommended |

---

**Checklist Last Updated:** February 20, 2026
**Tester:** (Your name here)
**Date Tested:** _______________
