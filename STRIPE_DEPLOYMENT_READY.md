# Stripe Deployment: Ready for Final Configuration

**Status:** ✅ DEPLOYED & LIVE
**Date:** 2026-02-20
**Production URL:** https://2e2e1386.coldcopy-au3.pages.dev

---

## What's Done

✅ Frontend built and deployed to Cloudflare Pages
✅ Paywall component integrated and tested
✅ Success and Cancel pages configured
✅ Payment Links created in Stripe (live)
✅ Routes configured (/success, /cancel)
✅ Deployment documentation written
✅ Payment tracking template created

---

## Next Steps: Founder Action Required

### CRITICAL: Configure Stripe Payment Links (5 min)

You need to set the success and cancel URLs in your Stripe Dashboard. This enables the redirect flow after payment.

**For BOTH Payment Links (Starter + Pro):**

1. Go to: https://dashboard.stripe.com/payment-links
2. Click the **Starter** payment link
3. Click "Edit" (top right)
4. Scroll to "After payment" section
5. Select "Custom page"
6. In the "Success URL" field, paste:
   ```
   https://2e2e1386.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}
   ```
7. In the "Cancel URL" field, paste:
   ```
   https://2e2e1386.coldcopy-au3.pages.dev/cancel
   ```
8. Click "Save changes"
9. **Repeat steps 2-8 for the Pro payment link**

That's it. Once both are configured, the payment flow is live.

---

## Payment Links Reference

| Plan | Price | LIVE Link |
|------|-------|-----------|
| **Starter** | $19 one-time (50 sequences) | https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01 |
| **Pro** | $39/month (unlimited) | https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02 |

---

## How to Test

Once you configure the Stripe URLs:

1. Visit: https://2e2e1386.coldcopy-au3.pages.dev/generate
2. Generate a sequence (should work)
3. Generate again (should show paywall)
4. Click "Go Pro"
5. Use Stripe test card: `4242 4242 4242 4242`
6. Expiry: `12/34`
7. CVC: `123`
8. Complete payment
9. Should redirect to `/success` page

---

## Manual Payment Processing (DevOps Runbook)

When you get your first customer payment:

1. Check Stripe Dashboard → Payments for notification
2. Note the customer email
3. Share the email with DevOps (or manually run):
   ```bash
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = (
       SELECT fingerprint FROM usage
       WHERE user_email = 'customer@example.com'
       LIMIT 1
     );
   "
   ```
4. Send welcome email to customer

See `/docs/devops/payment-tracking.md` for full checklist.

---

## Key Files

| File | Purpose |
|------|---------|
| `/docs/devops/cycle-8-stripe-deployment.md` | Full deployment runbook |
| `/docs/devops/payment-tracking.md` | Payment processing checklist |
| `/frontend/src/components/Paywall.tsx` | Pricing modal (hardcoded Stripe links) |
| `/frontend/src/pages/Success.tsx` | Success confirmation page |
| `/frontend/src/pages/Cancel.tsx` | Cancel confirmation page |

---

## Cost Breakdown

**Stripe Fees:**
- $19 Starter: $0.85 fee → **$18.15 net**
- $39 Pro: $1.43 fee → **$37.57 net**

**Infrastructure:**
- Cloudflare Pages: Free (included in existing plan)
- Stripe Payment Links: Free
- D1 Database: No additional cost

**Total Monthly Cost:** $0 (fees only on sales)

---

## Architecture

```
User visits generate page
         ↓
Generates sequence (API call)
         ↓
Quota exceeded → API returns 402
         ↓
Paywall modal appears (Paywall.tsx)
         ↓
User clicks "Go Pro" → Opens Stripe Payment Link
         ↓
User completes payment in Stripe Checkout
         ↓
Stripe redirects to /success?session_id=cs_xxx
         ↓
Success page shows confirmation + next steps
         ↓
DevOps manually grants quota in D1 (within 24h)
         ↓
User can generate unlimited sequences
```

---

## What You Don't Need to Do

- Write webhook code (MVP uses manual processing)
- Set up email automation (send manually or use template)
- Create admin dashboard (track in spreadsheet for now)
- Build subscription management UI (Stripe handles it)

---

## Next Automation (Post-MVP)

Once you have paying customers and want to reduce manual work:

1. **Webhook Automation** — Auto-grant quota on payment success
2. **Email Collection** — Collect email during generation to make matching easier
3. **Admin Dashboard** — Track payments and quotas in UI
4. **Self-Service Billing Portal** — Stripe Customer Portal link

Not needed until you have >10 paying customers.

---

## Questions?

- Paywall not showing? Check that generation returns HTTP 402 on quota exceeded
- Stripe checkout not loading? Verify success_url format in Dashboard
- Payment processed but quota not upgraded? Manually run the D1 update command above
- User email not available? Check Stripe Dashboard payment details for email

---

**Status:** Production is live. Just configure those two Stripe URLs and you're shipping.
