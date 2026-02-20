# Stripe Integration Testing Guide

**Purpose:** End-to-end testing checklist for Stripe Payment Links integration.

---

## Pre-Deployment Checklist

### 1. Stripe Dashboard Configuration

- [ ] Log in to Stripe Dashboard (stripe.com)
- [ ] Navigate to Products → Payment Links
- [ ] Find "ColdCopy Starter" link
- [ ] Click "Edit" → Update URLs:
  - Success URL: `https://3bcc41e1.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}`
  - Cancel URL: `https://3bcc41e1.coldcopy-au3.pages.dev/cancel`
- [ ] Save changes
- [ ] Repeat for "ColdCopy Pro" link
- [ ] Verify both links show as "Active"

---

## Testing Flow

### Test 1: Paywall Display (Generate Page)

**Scenario:** User hits quota limit during generation.

**Steps:**
1. Open `https://3bcc41e1.coldcopy-au3.pages.dev/generate`
2. Fill out form completely
3. Submit form
4. (Assuming user already used free quota) API returns 402
5. **Expected:** Paywall modal appears
6. **Verify:**
   - Modal has backdrop blur
   - Two pricing cards visible (Starter + Pro)
   - "Most Popular" badge on Pro card
   - Prices correct ($19 one-time, $39/month)
   - "Get Starter" and "Go Pro" buttons visible

**Result:** ✅ / ❌

---

### Test 2: Paywall Display (Output Page)

**Scenario:** User views generated sequence and wants to upgrade.

**Steps:**
1. Navigate to `/output` (after successful generation)
2. Scroll to bottom
3. Find "Want More Sequences?" section
4. Click "Upgrade Now" button
5. **Expected:** Paywall modal appears
6. **Verify:** Same as Test 1

**Result:** ✅ / ❌

---

### Test 3: Starter Plan Checkout (Test Mode)

**Scenario:** User clicks Starter plan and completes test payment.

**Steps:**
1. Open paywall modal
2. Click "Get Starter" button
3. **Expected:** New tab opens to Stripe Checkout
4. **Verify:**
   - Stripe Checkout loads
   - Product: "ColdCopy Starter"
   - Price: $19.00 USD
   - Test mode indicator visible
5. Fill in test card: `4242 4242 4242 4242`
6. Expiry: Any future date (e.g., `12/34`)
7. CVC: Any 3 digits (e.g., `123`)
8. Click "Pay $19.00"
9. **Expected:** Redirect to `/success?session_id=...`
10. **Verify:**
    - Success page loads
    - "Payment Successful!" message
    - Session ID visible in URL
    - "What happens next?" section explains 24h manual upgrade
    - "Return to ColdCopy" button works

**Result:** ✅ / ❌

**Session ID:** _________________

---

### Test 4: Pro Plan Checkout (Test Mode)

**Scenario:** User clicks Pro plan and completes test payment.

**Steps:**
1. Open paywall modal
2. Click "Go Pro" button
3. **Expected:** New tab opens to Stripe Checkout
4. **Verify:**
   - Stripe Checkout loads
   - Product: "ColdCopy Pro"
   - Price: $39.00 USD / month
   - "Recurring payment" indicator visible
   - Test mode indicator visible
5. Fill in test card: `4242 4242 4242 4242`
6. Expiry: Any future date
7. CVC: Any 3 digits
8. Click "Subscribe"
9. **Expected:** Redirect to `/success?session_id=...`
10. **Verify:** Same as Test 3

**Result:** ✅ / ❌

**Session ID:** _________________

---

### Test 5: Checkout Cancellation

**Scenario:** User starts checkout but cancels.

**Steps:**
1. Open paywall modal
2. Click "Get Starter" or "Go Pro"
3. Stripe Checkout opens
4. Click browser back button or close tab
5. Return to ColdCopy
6. Click "Get Starter" again
7. Stripe Checkout opens
8. Click "← Back to your site" (or similar)
9. **Expected:** Redirect to `/cancel`
10. **Verify:**
    - Cancel page loads
    - "Payment Cancelled" message
    - "No worries! You can upgrade anytime." reassurance
    - "Back to ColdCopy" button works
    - "Go to Homepage" button works

**Result:** ✅ / ❌

---

### Test 6: Mobile Responsiveness

**Scenario:** User accesses paywall on mobile device.

**Steps:**
1. Open `https://3bcc41e1.coldcopy-au3.pages.dev` on mobile browser
2. Navigate to Generate page
3. Trigger paywall (submit form or use direct link)
4. **Verify:**
   - Paywall modal fits screen (no horizontal scroll)
   - Pricing cards stack vertically (not side-by-side)
   - Buttons are tappable (not too small)
   - Text is readable (not too small)
   - Modal can be closed (X button or backdrop tap)

**Result:** ✅ / ❌

---

### Test 7: Keyboard Accessibility

**Scenario:** User navigates with keyboard.

**Steps:**
1. Open paywall modal
2. Press `Tab` key multiple times
3. **Verify:**
   - Focus indicator visible on buttons
   - Can navigate between "Get Starter" and "Go Pro" buttons
   - Press `Enter` on button → redirects to Stripe
4. Press `Escape` key
5. **Verify:** Modal closes

**Result:** ✅ / ❌

---

### Test 8: Direct URL Access

**Scenario:** User bookmarks or shares success/cancel pages.

**Steps:**
1. Navigate directly to `https://3bcc41e1.coldcopy-au3.pages.dev/success`
2. **Verify:** Page loads without errors (no crash)
3. Navigate directly to `https://3bcc41e1.coldcopy-au3.pages.dev/cancel`
4. **Verify:** Page loads without errors

**Result:** ✅ / ❌

---

### Test 9: Analytics Tracking

**Scenario:** Verify Google Tag Manager fires on success.

**Steps:**
1. Open browser DevTools → Console
2. Complete test checkout (Test 3 or 4)
3. Land on `/success` page
4. Check console for GTM event
5. **Expected:** Event log: `gtag('event', 'purchase', ...)`
6. **Verify:**
   - Event name: "purchase"
   - Transaction ID: session_id or timestamp
   - Currency: "USD"

**Result:** ✅ / ❌

---

## Production Testing (Live Stripe)

**WARNING:** Use real card only when testing live mode. Stripe will charge real money.

### Test 10: Live Starter Purchase

**Steps:**
1. Switch Stripe to live mode (not test mode)
2. Update Payment Links to live mode URLs (if different)
3. Complete checkout with real card (use founder's card)
4. **Expected:** Charge appears in Stripe Dashboard
5. **Verify:**
   - Payment successful
   - Session ID in Dashboard matches URL
   - Email receipt sent to card holder
6. **Manual quota upgrade:**
   - Check D1 database for user fingerprint
   - Run quota upgrade command (see `/docs/devops/payment-tracking.md`)
   - User can now generate unlimited sequences

**Result:** ✅ / ❌

**Amount charged:** $___________
**Session ID:** _________________
**Fingerprint upgraded:** _________________

---

### Test 11: Live Pro Subscription

**Steps:**
1. Complete Pro checkout with real card
2. **Expected:** Subscription created in Stripe Dashboard
3. **Verify:**
   - Subscription status: "Active"
   - Next billing date: 1 month from now
   - Customer record created
   - Email receipt sent
4. **Manual quota upgrade:** Same as Test 10

**Result:** ✅ / ❌

**Subscription ID:** _________________
**Next billing date:** _________________

---

## Stripe Test Cards

Use these for test mode only:

| Card Number | Brand | Behavior |
|-------------|-------|----------|
| `4242 4242 4242 4242` | Visa | Success |
| `4000 0025 0000 3155` | Visa | Requires 3D Secure |
| `4000 0000 0000 9995` | Visa | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Visa | Declined (generic) |

**Full list:** https://docs.stripe.com/testing#cards

---

## Common Issues & Fixes

### Issue: Paywall doesn't appear
**Cause:** JavaScript error or incorrect state
**Fix:**
1. Open DevTools Console
2. Check for errors
3. Verify API returns HTTP 402
4. Check React state in DevTools (React tab)

### Issue: Stripe link returns 404
**Cause:** Payment link deactivated or deleted
**Fix:**
1. Check Stripe Dashboard → Payment Links
2. Verify link status is "Active"
3. Re-create link if needed
4. Update Paywall.tsx with new URL

### Issue: Success page missing session_id
**Cause:** Stripe success URL misconfigured
**Fix:**
1. Edit Payment Link in Stripe Dashboard
2. Ensure success URL ends with `?session_id={CHECKOUT_SESSION_ID}`
3. Note: `{CHECKOUT_SESSION_ID}` is a Stripe template variable, keep curly braces

### Issue: Modal doesn't close on ESC
**Cause:** Event listener not attached
**Fix:**
1. Check Paywall.tsx useEffect hook
2. Verify `window.addEventListener('keydown', handleEscape)` is called
3. Check browser console for errors

### Issue: Mobile layout broken
**Cause:** CSS grid not responsive
**Fix:**
1. Check `grid md:grid-cols-2` class
2. Should stack on mobile (<768px width)
3. Test in Chrome DevTools mobile emulator

---

## Rollback Plan

If integration fails in production:

### Step 1: Disable Paywall
1. Edit `Paywall.tsx`
2. Change `if (!isOpen) return null;` to `return null;` (always hide)
3. Deploy immediately

### Step 2: Add Maintenance Message
1. Replace paywall trigger with toast:
   ```tsx
   toast({
     message: 'Payments temporarily unavailable. Check back soon.',
     type: 'info',
   });
   ```

### Step 3: Notify Users
1. Post on landing page: "Payments under maintenance"
2. Provide email contact for urgent upgrades
3. Manually process payments via Stripe invoices

### Step 4: Fix and Redeploy
1. Identify root cause
2. Fix issue in local environment
3. Re-test completely
4. Deploy fix
5. Remove maintenance message

---

## Success Criteria

Integration is successful when:

- [ ] All 9 functional tests pass (Tests 1-9)
- [ ] At least 1 live payment completes successfully (Test 10 or 11)
- [ ] Manual quota upgrade completes within 24h
- [ ] User confirms they can generate sequences after upgrade
- [ ] No JavaScript errors in browser console
- [ ] No 404 or 500 errors in server logs
- [ ] Analytics events fire correctly
- [ ] Mobile experience is smooth (no layout breaks)

---

## Post-Launch Monitoring

First 7 days after launch, track:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Paywall show rate | 20-30% | HTTP 402 responses / total API calls |
| Paywall click rate | 15-25% | Stripe Checkout starts / paywall shows |
| Checkout completion | 50%+ | Successful payments / checkout starts |
| Payment errors | <5% | Failed charges / total attempts |
| Manual upgrade SLA | <24h | Time from payment to quota upgrade |

**Review:** Daily for first week, then weekly.

**Responsible:** DevOps (hightower) + Sales (ross)

---

**Next:** After all tests pass, mark integration as ✅ Production Ready and ship.
