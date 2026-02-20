# ColdCopy Payment Flow — Pre-Launch Test Checklist

**Deployment Date:** 2026-02-20 12:30 UTC
**Production URL:** https://e0fee18a.coldcopy-au3.pages.dev
**Environment:** Stripe Test Mode (card: 4242 4242 4242 4242)

---

## Test 1: Landing Page Load

**Goal:** Verify site loads and landing page renders correctly

```
[ ] Open https://e0fee18a.coldcopy-au3.pages.dev in browser
[ ] See ColdCopy logo and hero section
[ ] "Start Free" CTA button visible
[ ] Page loads within <3 seconds
[ ] No JavaScript errors in console
```

---

## Test 2: Free Generation (First Use)

**Goal:** Verify user can generate 1 free sequence without paywall

```
[ ] Click "Start Free" on landing page
[ ] Navigate to /generate page
[ ] See "Generate Your Cold Email Sequence" form
[ ] Fill form:
    - Company Name: "Test Company"
    - Target Job Title: "VP of Sales"
    - Problem They Face: "They struggle with lead generation"
    - Your Product: "Sales automation platform for outbound"
    - Key Benefit: "Double your cold email response rates"
    - Call to Action: "Schedule a 15-minute demo"
    - Tone: "Professional"
[ ] All fields are valid (no error messages)
[ ] Submit button is enabled
[ ] Click "Generate Sequence"
[ ] See loading bar ("Generating your sequence...")
[ ] Wait 3-5 seconds for generation
[ ] Redirected to /output page
[ ] See 7 emails displayed in sequence
[ ] Subject lines, preview text, and full email copy all visible
[ ] No paywall modal appeared (✓ CORRECT - first generation is free)
```

**Expected Result:** ✅ 7 emails generated, no paywall

---

## Test 3: Paywall Trigger (Second Generation)

**Goal:** Verify paywall modal appears on second generation attempt

```
[ ] On /output page, scroll to top
[ ] Click "← Back to Home" link
[ ] Click "Start Free" again
[ ] Now on /generate page again
[ ] Fill form again with different data:
    - Company Name: "Acme Analytics"
    - Target Job Title: "Head of Marketing"
    - Problem They Face: "They lose 40% of revenue to cart abandonment"
    - Your Product: "Real-time analytics dashboard for e-commerce"
    - Key Benefit: "Identify why carts abandon in 10 seconds"
    - Call to Action: "Book a 30-minute demo"
    - Tone: "Casual"
[ ] Click "Generate Sequence"
[ ] See loading bar appear
[ ] **PAYWALL MODAL SHOULD APPEAR** (blocking generation)
[ ] Modal has white background with two pricing cards
[ ] Header: "You've Reached Your Free Limit"
[ ] Two cards visible: "Starter" and "Pro"
```

**Expected Result:** ✅ Paywall modal appears (HTTP 402 triggered)

---

## Test 4: Paywall Modal Components

**Goal:** Verify paywall displays correct pricing and features

### Left Card (Starter)
```
[ ] Title: "Starter"
[ ] Price: "$19" (one-time)
[ ] Features listed:
    - "50 email sequences"
    - "A/B subject line variants"
    - "SaaS-optimized copy"
    - "Copy-paste ready for any tool"
[ ] Button: "Get Starter" (white/outline style)
[ ] Subtext: "Perfect for testing ColdCopy"
```

### Right Card (Pro - Most Popular)
```
[ ] Title: "Pro"
[ ] Badge: "Most Popular" (blue background)
[ ] Price: "$39" (/month)
[ ] Features listed:
    - "Unlimited sequences"
    - "A/B subject line variants"
    - "SaaS-optimized copy"
    - "Copy-paste ready for any tool"
    - "Priority support"
[ ] Button: "Go Pro" (primary/filled style)
[ ] Subtext: "Best for serious outbound campaigns"
```

### Modal Controls
```
[ ] Close button (X) visible in top-right
[ ] Press ESC key → Modal closes
[ ] Click outside modal → Modal closes
[ ] Footer text: "Secure payment powered by Stripe"
```

**Expected Result:** ✅ All pricing and UI elements correct

---

## Test 5: Stripe Payment Link — Pro Plan

**Goal:** Verify Stripe checkout opens correctly

```
[ ] In paywall modal, click "Go Pro" button
[ ] A new browser tab opens (don't close original tab)
[ ] New tab shows "Stripe" and "Checkout" page
[ ] URL contains "buy.stripe.com"
[ ] Payment form visible with:
    - Email input field
    - Card number field
    - Expiry and CVC fields
    - "Pay $39.00" or similar button
[ ] No error messages
[ ] Page loads within <3 seconds
```

**Expected Result:** ✅ Stripe checkout page opens in new tab

---

## Test 6: Stripe Payment Link — Starter Plan

**Goal:** Verify Starter payment link also works

```
[ ] Go back to original tab with paywall modal
[ ] Modal should still be open (OK to re-trigger if closed)
[ ] Click "Get Starter" button
[ ] A new browser tab opens
[ ] New tab shows Stripe checkout page
[ ] Payment form visible
[ ] Price shows "$19.00" (one-time, not /month)
[ ] All elements render correctly
```

**Expected Result:** ✅ Starter checkout opens with correct $19 price

---

## Test 7: Success Page (Optional - Test Payment)

**Goal:** Verify success flow after payment completion

```
Prerequisites: Have Stripe test card ready: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)

[ ] In Stripe checkout (Pro plan), fill payment form:
    - Email: "test@example.com"
    - Card: "4242 4242 4242 4242"
    - Expiry: "12/25"
    - CVC: "123"
[ ] Click "Pay $39.00" button
[ ] Wait for processing (5-10 seconds)
[ ] **Redirected to /success page**
[ ] See checkmark icon
[ ] Heading: "Payment Successful!"
[ ] Subheading: "Thank you for upgrading to ColdCopy Pro"
[ ] "What happens next?" section with 4 steps:
    1. Check email for payment confirmation
    2. Your quota will be upgraded within 24 hours
    3. You'll receive welcome email
    4. Need help? Reply to email or contact support
[ ] Transaction ID displayed (bottom right corner)
[ ] Button: "Return to ColdCopy" (primary)
```

**Expected Result:** ✅ Success page loads with confirmation details

---

## Test 8: Cancel Flow

**Goal:** Verify user can cancel without completing payment

```
[ ] In Stripe checkout, click browser back button
[ ] **Redirected to /cancel page**
[ ] See X icon (red/muted style)
[ ] Heading: "Payment Cancelled"
[ ] Subheading: "No worries! You can upgrade anytime."
[ ] Message box: "You still have access to your free generation."
[ ] Two buttons visible:
    - "Back to ColdCopy" (primary)
    - "Go to Homepage" (outline)
[ ] Click "Back to ColdCopy" → Returns to /generate
[ ] Back to /generate, paywall is reset (can close if modal is still open)
```

**Expected Result:** ✅ Cancel page shows correct message and CTAs

---

## Test 9: Modal Close Behavior

**Goal:** Verify user can close paywall and return to form

```
[ ] On /generate page (paywall modal visible)
[ ] Click X button in top-right of modal
[ ] Modal closes
[ ] Form is still visible behind modal
[ ] Form data is preserved (if filled before paywall appeared)
[ ] Click "Generate Sequence" again
[ ] Paywall appears again (expected behavior)
[ ] OR: Press ESC key
[ ] Modal closes (ESC shortcut works)
```

**Expected Result:** ✅ Modal closes with X button or ESC key

---

## Test 10: Infrastructure & Logs

**Goal:** Verify backend infrastructure is operational

```
[ ] Run: wrangler tail --project-name coldcopy --env production
[ ] See live logs as you interact with the app
[ ] Should see entries like:
    - Page loads (/generate, /success, /cancel)
    - API calls (/api/generate)
    - No error messages (should all be 200 OK)
[ ] D1 database accessible:
    - wrangler d1 execute coldcopy-db --command "SELECT COUNT(*) FROM sequences;"
    - Should return a number (count of sequences generated)
[ ] KV cache operational:
    - Rate limiting working (no errors when spamming requests)
```

**Expected Result:** ✅ All backend services operational, no errors

---

## Test 11: Browser Compatibility

**Goal:** Verify paywall renders correctly across browsers

```
Chrome/Chromium:
[ ] Paywall modal displays correctly
[ ] Buttons are clickable
[ ] No layout issues
[ ] Payment links open in new tab

Firefox:
[ ] Paywall modal displays correctly
[ ] Form validation works
[ ] Modal close (X button) works
[ ] ESC key closes modal

Safari (if available):
[ ] Paywall displays
[ ] Text is readable
[ ] Buttons respond to clicks
```

**Expected Result:** ✅ Works on all major browsers

---

## Test 12: Mobile Responsive

**Goal:** Verify paywall is mobile-friendly

```
Open on mobile device or use browser dev tools (F12 → Device emulation)
Set viewport to: iPhone 12 (390x844) or similar

[ ] Landing page loads and is readable
[ ] "Start Free" button is clickable (not tiny)
[ ] /generate form is scrollable and usable
[ ] All form fields are accessible
[ ] Paywall modal appears and is readable on mobile
[ ] Pricing cards stack vertically (one per row)
[ ] "Get Starter" and "Go Pro" buttons are mobile-sized (>44px height)
[ ] X button is easy to tap
[ ] Stripe checkout page responsive
```

**Expected Result:** ✅ All pages are mobile responsive

---

## Test 13: Error Handling

**Goal:** Verify error messages display correctly

```
[ ] Intentionally break form validation:
    - Try to submit with empty fields
    - Should see error messages under each field
    - "This field is required" appears in red
[ ] Try to submit with text too short:
    - Company Name: "A" (only 1 char)
    - Should see "Minimum 1 characters required"
[ ] Try to submit with text too long:
    - Company Name: > 50 characters
    - Should see "Maximum 50 characters"
[ ] Close paywall and try 2nd generation again
    - Paywall should appear again (not one-time only)
```

**Expected Result:** ✅ Error messages clear and helpful

---

## Final Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Time:** ___________________

### Results Summary
```
Free Generation (Test 2):     [ ] PASS [ ] FAIL
Paywall Trigger (Test 3):     [ ] PASS [ ] FAIL
Paywall UI (Test 4):          [ ] PASS [ ] FAIL
Stripe Pro Link (Test 5):     [ ] PASS [ ] FAIL
Stripe Starter Link (Test 6): [ ] PASS [ ] FAIL
Success Page (Test 7):        [ ] PASS [ ] FAIL
Cancel Flow (Test 8):         [ ] PASS [ ] FAIL
Modal Controls (Test 9):      [ ] PASS [ ] FAIL
Infrastructure (Test 10):     [ ] PASS [ ] FAIL
Browser Compat (Test 11):     [ ] PASS [ ] FAIL
Mobile Responsive (Test 12):  [ ] PASS [ ] FAIL
Error Handling (Test 13):     [ ] PASS [ ] FAIL
```

### Overall Status
```
[ ] ALL TESTS PASS — READY FOR LAUNCH
[ ] SOME FAILURES — SEE NOTES BELOW
[ ] CRITICAL FAILURES — ROLLBACK REQUIRED
```

### Notes
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## Quick Reference

| Flow | Expected | Status |
|------|----------|--------|
| 1st generation | Free, no paywall | ✅ |
| 2nd generation | Paywall appears (402) | ✅ |
| Click "Go Pro" | Stripe checkout opens | ✅ |
| Complete payment | Redirect to /success | ✅ |
| Cancel payment | Redirect to /cancel | ✅ |
| Close modal | Returns to form | ✅ |
| ESC key | Modal closes | ✅ |
| Mobile view | Responsive layout | ✅ |

---

**Production URL:** https://e0fee18a.coldcopy-au3.pages.dev
**Test Mode:** Enabled (use 4242 4242 4242 4242)
**Status:** READY FOR TESTING

