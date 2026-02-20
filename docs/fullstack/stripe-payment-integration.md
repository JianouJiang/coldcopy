# Stripe Payment Links Integration — ColdCopy

**Date:** 2026-02-20
**Status:** ✅ Complete (Frontend Integration)
**Author:** fullstack-dhh

## Overview

ColdCopy's payment integration uses **Stripe Payment Links** — the fastest way to accept payments without writing payment code. Users hit a 402 paywall when quota is exceeded, see pricing options, click upgrade, and land on Stripe's hosted checkout.

## Architecture

```
User generates email → API returns 402 → Paywall modal appears →
User clicks "Upgrade" → Redirects to Stripe Checkout →
Payment succeeds → Redirects to /success page →
Manual quota upgrade (MVP) / Webhook automation (Day 5+)
```

## Implementation

### 1. Payment Links (LIVE)

| Plan | Price | Link |
|------|-------|------|
| **Starter** | $19 one-time | `https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01` |
| **Pro** | $39/month | `https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02` |

**Critical Configuration Required on Stripe Dashboard:**

Both Payment Links MUST have these settings:

```
Success URL: https://coldcopy.app/success?session_id={CHECKOUT_SESSION_ID}
Cancel URL: https://coldcopy.app/cancel
```

*(Replace `coldcopy.app` with actual production domain)*

**How to verify:**
1. Go to Stripe Dashboard → Payment Links
2. Click each Payment Link
3. Edit → After payment → Custom page → Set success URL
4. Save changes

### 2. Frontend Components

#### `/frontend/src/components/Paywall.tsx`
- Modal overlay with pricing comparison
- Highlights Pro as recommended
- Direct links to Stripe Payment Links
- Mobile responsive
- Closes on ESC or outside click

**Key Features:**
- No backend required (Payment Links handle checkout)
- No PCI compliance burden (Stripe-hosted)
- A/B test pricing by swapping links
- Can update prices in Stripe Dashboard without code changes

#### `/frontend/src/pages/Generate.tsx` (Lines 154-162)
```typescript
if (response.status === 402) {
  setShowPaywall(true);
  toast({
    message: 'You have reached your generation limit. Upgrade to continue.',
    type: 'error',
  });
  return;
}
```

**Trigger:** When `/api/generate` returns HTTP 402 (Payment Required)

#### `/frontend/src/pages/Success.tsx`
- Confirmation page after successful payment
- Explains 24-hour manual quota upgrade (MVP phase)
- Extracts `session_id` from URL for tracking
- Analytics conversion tracking ready (if GA configured)

**Important Note:**
The success page tells users quota will be upgraded **within 24 hours** because we're manually processing payments in MVP. This sets expectations correctly and avoids support tickets.

#### `/frontend/src/App.tsx`
Routes configured:
- `/success` → Success page
- `/cancel` → Cancel page (if user abandons checkout)

### 3. User Flow

**Scenario A: Free User Hits Limit**
1. User fills form on `/generate`
2. Submits → API returns 402
3. Paywall modal appears over the form
4. User clicks "Go Pro" or "Get Starter"
5. New tab opens → Stripe Checkout
6. User completes payment
7. Redirected to `/success`
8. DevOps manually grants quota (logs payment email → updates D1)

**Scenario B: User Abandons Checkout**
1. User clicks upgrade → Stripe Checkout opens
2. User closes tab or clicks "Back"
3. Redirected to `/cancel` page
4. Can return to `/generate` to try again

**Scenario C: Returning Pro User**
1. User generates email → API checks fingerprint quota
2. Pro tier → 9999 quota → never hits 402
3. Generates unlimited sequences

## Testing

### Local Testing
```bash
cd frontend
npm run dev
```

1. **Test Paywall Trigger:**
   - Open DevTools → Network tab
   - Generate a sequence
   - In Network tab, right-click the `/api/generate` request → "Copy as fetch"
   - In Console, modify the fetch to return a mock 402 response
   - Verify paywall appears

2. **Test Payment Links:**
   - Click "Go Pro" → should open Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits
   - Complete payment → should redirect to `/success`

**Note:** Use Stripe Test Mode links for testing. The current links are LIVE.

### Production Testing
```bash
# Test with real payment (use your own card)
1. Deploy to production
2. Generate sequences until 402
3. Click upgrade → complete real payment
4. Verify redirect to /success
5. Manually grant quota in D1
6. Verify user can generate again
```

## Webhook Integration (Day 5+)

**Current:** Manual quota upgrade via DevOps
**Future:** Automatic webhook-driven quota upgrade

When ready to automate:

1. **Create Webhook Endpoint:** `/api/webhooks/stripe`
   - Listens for `checkout.session.completed`
   - Extracts `customer_email` and `subscription_id`
   - Updates D1 `tiers` table with quota

2. **Configure Webhook in Stripe:**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://coldcopy.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

3. **Security:**
   - Verify webhook signature using Stripe's SDK
   - Store webhook secret in Cloudflare Workers secrets
   - Return 200 immediately, process async

4. **Handle Subscription Lifecycle:**
   - New subscription → Grant Pro quota (9999)
   - Payment failed → Downgrade to free (1)
   - Subscription cancelled → Schedule quota removal at period_end

## Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| User clicks "Upgrade" multiple times | Each click opens a new Stripe Checkout tab. No harm — Stripe deduplicates by email |
| Payment succeeds but user closes /success page | Email confirmation from Stripe is the source of truth. DevOps processes payment from Stripe Dashboard |
| User pays but quota not upgraded | Success page says "within 24 hours". User emails support if longer |
| Stripe Payment Link deleted | Paywall links break. Monitor Stripe Dashboard for accidental deletions |
| User on /generate → API down → 500 error | Toast shows "An error occurred. Please try again." No paywall trigger |

## Monitoring & Metrics

**Track These:**
1. **Paywall Show Rate:** How many users hit 402?
2. **Paywall Click Rate:** How many click "Upgrade"?
3. **Stripe Checkout Abandon Rate:** How many reach Stripe but don't pay?
4. **Conversion Rate:** Paywall show → Payment success
5. **Time to Quota Upgrade:** Payment timestamp → Quota granted timestamp

**Where to Track:**
- Stripe Dashboard → Analytics
- Google Analytics (if configured)
- Cloudflare Analytics (Workers)
- Manual log: DevOps tracks payments in spreadsheet (MVP)

## Cost Analysis

**Stripe Fees:**
- $19 Starter: $0.85 fee (2.9% + $0.30) = **$18.15 net**
- $39 Pro: $1.43 fee = **$37.57 net**

**No ongoing costs:**
- Payment Links are free
- No SaaS billing tool needed
- No custom checkout code to maintain

## Deployment Checklist

Before going live:

- [ ] Verify Stripe Payment Links have correct success_url
- [ ] Test full payment flow in Stripe Test Mode
- [ ] Switch to Stripe Live Mode
- [ ] Update Payment Link URLs in `Paywall.tsx` (if not already live)
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Test 402 paywall trigger in production
- [ ] Verify /success page loads correctly
- [ ] Set up email monitoring for Stripe payment confirmations
- [ ] Document manual quota upgrade process for DevOps
- [ ] Add payment tracking to internal dashboard

## Manual Quota Upgrade Process (MVP)

**When a payment comes in:**

1. Check Stripe Dashboard → Payments → Latest payment
2. Note customer email and plan (Starter/Pro)
3. SSH into Cloudflare D1:
   ```bash
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = (
       SELECT fingerprint FROM usage
       WHERE user_email = 'customer@example.com'
     )
   "
   ```
4. Send welcome email to customer:
   - Subject: "Welcome to ColdCopy Pro!"
   - Body: "Your quota is now unlimited. Start generating sequences at coldcopy.app/generate"
5. Log payment in tracking spreadsheet

**SLA:** Within 24 hours (as stated on /success page)

## Future Enhancements

1. **Webhook Automation** (Day 5+): Auto-grant quota on payment
2. **Subscription Management Portal:** Let users manage billing via Stripe Customer Portal
3. **Usage-Based Billing:** Charge $X per 100 sequences instead of unlimited
4. **Annual Plans:** Offer $390/year (save $78) for Pro
5. **Team Plans:** Multi-seat pricing for agencies
6. **Affiliate Program:** Rev-share for referrals via Stripe Partner Connect

## References

- Stripe Payment Links Docs: https://stripe.com/docs/payment-links
- Stripe Webhooks Guide: https://stripe.com/docs/webhooks
- Cloudflare Workers + Stripe: https://developers.cloudflare.com/workers/examples/stripe-webhook

---

**Summary:** Payment integration is complete. Frontend shows paywall on 402, links to Stripe, and handles success page. Manual quota upgrade for MVP. Webhook automation when ready to scale.
