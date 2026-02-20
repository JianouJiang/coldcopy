# Stripe Payment Integration — ColdCopy

**Date:** 2026-02-20
**Engineer:** DHH (fullstack)
**Status:** ✅ Complete (Frontend Ready)

---

## Overview

Integrated Stripe Payment Links into ColdCopy frontend. Users hit quota limit → see paywall → click upgrade → redirect to Stripe Checkout → return to success/cancel page.

**Key principle:** Keep it simple. Payment Links handle checkout, we just need UI to show them.

---

## Implementation

### 1. Paywall Component

**File:** `/frontend/src/components/Paywall.tsx`

Modal that appears when users hit quota. Shows two pricing tiers with direct links to Stripe.

**Key features:**
- Dual-tier pricing display (Starter $19 one-time, Pro $39/month)
- Modal overlay with backdrop blur
- Keyboard accessible (ESC to close)
- Mobile-responsive (side-by-side → stacked)
- Visual hierarchy (Pro marked as "Most Popular")

**Code snippet:**
```tsx
const STARTER_LINK = 'https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01';
const PRO_LINK = 'https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02';

// Links open in new tab, users complete checkout, return via success/cancel URLs
<a href={STARTER_LINK} target="_blank" rel="noopener noreferrer">
  <Button size="lg" variant="outline" className="w-full">
    Get Starter
  </Button>
</a>
```

**Benefits:**
- No backend integration needed (Payment Links handle everything)
- No payment form code to maintain
- PCI compliance handled by Stripe
- Works instantly

---

### 2. Trigger Points

Paywall shows in two places:

#### A. Generate Page (HTTP 402 Error)

**File:** `/frontend/src/pages/Generate.tsx` (lines 154-162)

When API returns 402 (quota exceeded), show paywall:

```tsx
if (response.status === 402) {
  // Show paywall modal instead of just a toast
  setShowPaywall(true);
  toast({
    message: 'You have reached your generation limit. Upgrade to continue.',
    type: 'error',
  });
  return;
}
```

**User flow:**
1. User submits form
2. API returns 402
3. Paywall modal appears
4. User clicks "Get Starter" or "Go Pro"
5. Redirects to Stripe Checkout

#### B. Output Page (Upgrade CTA)

**File:** `/frontend/src/pages/Output.tsx` (lines 166-178)

After viewing results, encourage upgrade:

```tsx
<Button
  size="lg"
  className="bg-primary hover:bg-primary/90"
  onClick={() => setShowPaywall(true)}
>
  Upgrade Now
</Button>
```

**User flow:**
1. User sees generated sequence
2. Sees "Want More Sequences?" CTA
3. Clicks "Upgrade Now"
4. Paywall modal appears

---

### 3. Success Page

**File:** `/frontend/src/pages/Success.tsx`

User lands here after completing Stripe Checkout.

**Key elements:**
- Success icon + confirmation message
- Sets expectations: "Quota upgrade within 24 hours" (manual process for MVP)
- Extracts `session_id` from URL query param for tracking
- CTA button: "Return to ColdCopy" → `/generate`
- Analytics tracking (Google Tag Manager)

**Code snippet:**
```tsx
const [searchParams] = useSearchParams();
const sessionId = searchParams.get('session_id');

useEffect(() => {
  // Track conversion event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      transaction_id: sessionId || Date.now(),
      currency: 'USD',
      items: [{ item_name: 'ColdCopy Subscription' }],
    });
  }
}, [sessionId]);
```

**What happens next (from user's perspective):**
1. Check email for Stripe receipt
2. Quota upgraded manually within 24h
3. Receive welcome email
4. Start generating unlimited sequences

---

### 4. Cancel Page

**File:** `/frontend/src/pages/Cancel.tsx`

User lands here if they cancel checkout.

**Key elements:**
- Neutral message: "Payment Cancelled"
- Reassurance: "You still have access to your free generation"
- Two CTAs:
  - "Back to ColdCopy" → `/generate`
  - "Go to Homepage" → `/`

**No pressure, no guilt.** Users can try again anytime.

---

## Routing

**File:** `/frontend/src/App.tsx`

Routes already configured:

```tsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/generate" element={<Generate />} />
  <Route path="/output" element={<Output />} />
  <Route path="/success" element={<Success />} />  {/* ✅ */}
  <Route path="/cancel" element={<Cancel />} />    {/* ✅ */}
</Routes>
```

All routes work. No changes needed.

---

## Stripe Configuration (DevOps Task)

### Required URLs

Payment Links need these URLs configured in Stripe Dashboard:

**Current deployment:** `https://3bcc41e1.coldcopy-au3.pages.dev`

| Link | Success URL | Cancel URL |
|------|-------------|------------|
| Starter ($19) | `https://3bcc41e1.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}` | `https://3bcc41e1.coldcopy-au3.pages.dev/cancel` |
| Pro ($39/mo) | `https://3bcc41e1.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}` | `https://3bcc41e1.coldcopy-au3.pages.dev/cancel` |

**Action required:** DevOps must update these URLs in Stripe Dashboard.

**How to update:**
1. Go to Stripe Dashboard → Products → Payment Links
2. Edit "ColdCopy Starter" link
3. Set Success URL: `https://3bcc41e1.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}`
4. Set Cancel URL: `https://3bcc41e1.coldcopy-au3.pages.dev/cancel`
5. Repeat for "ColdCopy Pro" link
6. Test with Stripe test card: `4242 4242 4242 4242`

---

## Testing Checklist

### Local Testing
- [x] `npm run dev` starts without errors
- [x] Paywall modal opens on button click
- [x] Payment links open in new tab
- [x] Success page renders correctly
- [x] Cancel page renders correctly
- [x] `npm run build` succeeds

### Production Testing (after deployment)
- [ ] Generate page shows paywall on 402 error
- [ ] Output page shows paywall on "Upgrade Now" click
- [ ] Paywall links redirect to Stripe Checkout
- [ ] Stripe Checkout returns to `/success` after payment
- [ ] Stripe Checkout returns to `/cancel` after cancel
- [ ] `session_id` appears in success page URL
- [ ] Analytics event fires on success page

### Edge Cases
- [ ] Mobile: Paywall displays correctly (stacked layout)
- [ ] Keyboard: ESC closes paywall
- [ ] Multiple clicks: Paywall doesn't break state
- [ ] Direct navigation to `/success` or `/cancel` works (no crash)

---

## Manual Quota Upgrade Process (MVP)

**Owner:** DevOps (hightower)

When customer completes payment:

1. **Notification:** Stripe sends email to founder
2. **Identify user:** Match payment timestamp to API logs
3. **Get fingerprint:** Extract user fingerprint from D1 database
4. **Update quota:**
   ```bash
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = '<user_fingerprint>';
   "
   ```
5. **Send welcome email:**
   - Subject: "Welcome to ColdCopy Pro! 🚀"
   - Body: "Your upgrade is live. Generate unlimited sequences at [link]"
6. **SLA:** Complete within 24 hours

**See:** `/docs/devops/payment-tracking.md` for detailed runbook.

---

## Future Improvements (Not MVP)

### Phase 1: Webhook Automation
- Add Stripe webhook endpoint to backend
- Listen for `checkout.session.completed` event
- Auto-upgrade quota on successful payment
- No manual intervention needed

### Phase 2: Email Collection
- Add email field to generation form
- Store email with fingerprint in D1
- Use email to match customers to payments
- Send automated welcome emails

### Phase 3: Customer Portal
- Add `/account` page
- Show current plan and usage
- Add "Manage Subscription" link (Stripe Customer Portal)
- Allow self-service plan changes

### Phase 4: A/B Testing
- Test different pricing ($9 vs $19 for Starter)
- Test different copy ("Upgrade" vs "Get More")
- Test different visual hierarchy (Pro first vs Starter first)

**For now: Ship MVP, validate pricing, iterate based on data.**

---

## Code Changes Summary

**Modified files:**
- None (all files already existed from previous work)

**Files verified:**
- `/frontend/src/components/Paywall.tsx` — Contains Stripe Payment Links ✅
- `/frontend/src/pages/Generate.tsx` — Shows paywall on 402 error ✅
- `/frontend/src/pages/Output.tsx` — Shows paywall on upgrade CTA ✅
- `/frontend/src/pages/Success.tsx` — Success page ready ✅
- `/frontend/src/pages/Cancel.tsx` — Cancel page ready ✅
- `/frontend/src/App.tsx` — Routes configured ✅

**Build status:**
```bash
$ npm run build
✓ built in 7.71s
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-dRJezaTM.css   28.06 kB │ gzip:   5.73 kB
dist/assets/index-vuHHK9xW.js   379.94 kB │ gzip: 117.33 kB
```

**Conclusion:** Frontend integration complete. Ready for deployment once DevOps updates Stripe URLs.

---

## What I Didn't Do (And Why)

### Backend Changes
**Reason:** Payment Links handle checkout. No backend code needed for payment processing.

### Stripe SDK Integration
**Reason:** Payment Links are URLs. Just redirect users. No SDK needed.

### Payment Form UI
**Reason:** Stripe Checkout handles forms, validation, card input, 3D Secure. We don't build payment forms.

### Webhook Endpoint
**Reason:** MVP uses manual quota upgrades. Webhooks are Phase 2.

### Email Collection
**Reason:** MVP uses fingerprinting. Email capture is Phase 2.

**Philosophy:** Start with the simplest thing that works. Add complexity only when validated by real customers.

---

## Next Steps

### DevOps (hightower)
1. Update Stripe Payment Link URLs to `https://3bcc41e1.coldcopy-au3.pages.dev/success` and `/cancel`
2. Test end-to-end payment flow with Stripe test card
3. Create manual quota upgrade runbook
4. Monitor first payment and upgrade user within 24h

### Sales (ross)
1. Test conversion funnel (free → paywall → Stripe → success)
2. Track metrics:
   - Paywall show rate
   - Paywall click rate
   - Checkout completion rate
   - Free-to-paid conversion
3. Report first customer payment to CEO

### Marketing (godin)
1. Add pricing page to landing site (if needed)
2. Prepare social proof messaging for first customers
3. Create "First Customer" story for blog/Twitter

---

## Questions & Support

**Q: Why Payment Links instead of Stripe Checkout API?**
A: Payment Links require zero backend code. Perfect for MVP. Upgrade to API when we need custom logic.

**Q: Why no webhook automation?**
A: Manual process validates flow before automating. First 5 customers = learn what breaks.

**Q: Why 24h SLA for quota upgrade?**
A: Honest communication. Under-promise, over-deliver. We'll likely upgrade in <1 hour, but promise 24h.

**Q: What if customer complains about manual process?**
A: Apologize, upgrade immediately, offer bonus credits. Early customers are forgiving if you're responsive.

**Q: What if Stripe link doesn't work?**
A: Check Stripe Dashboard for link status. Verify URLs. Test with test card `4242 4242 4242 4242`.

---

**Status:** ✅ Frontend integration complete. Awaiting DevOps to update Stripe URLs and test end-to-end.
