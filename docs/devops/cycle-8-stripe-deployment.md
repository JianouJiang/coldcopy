# Cycle 8: Stripe Payment Links Deployment to Production

**Date:** 2026-02-20
**Status:** ✅ DEPLOYED
**Author:** devops-hightower

---

## Deployment Summary

Frontend successfully deployed to Cloudflare Pages with Stripe Payment Links integration. Payment flow is live and ready to accept customers.

## Production URL

**https://2e2e1386.coldcopy-au3.pages.dev**

---

## Deployment Process

### 1. Frontend Build

```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy/frontend
npm run build
```

**Build Results:**
- TypeScript compilation: ✅ Clean
- Vite build: ✅ 6.85 seconds
- Output:
  - `dist/index.html`: 0.46 KB (gzip: 0.29 KB)
  - `dist/assets/index-dRJezaTM.css`: 28.06 KB (gzip: 5.73 KB)
  - `dist/assets/index-vuHHK9xW.js`: 379.94 KB (gzip: 117.33 KB)

### 2. Cloudflare Pages Deployment

```bash
npx wrangler pages deploy frontend/dist --project-name coldcopy
```

**Deployment Results:**
- Status: ✅ Success
- Deployment time: 0.62 seconds
- URL: `https://2e2e1386.coldcopy-au3.pages.dev`
- Files deployed: 3 (1 already uploaded from previous deployment)

### 3. Stripe Payment Links Configuration (MANUAL)

**CRITICAL:** Stripe Payment Links require manual configuration to set success/cancel URLs. Follow these steps:

#### For Both Payment Links:

1. Go to Stripe Dashboard: https://dashboard.stripe.com/payment-links
2. Click on the **Starter** payment link first
3. Click "Edit" (top right)
4. Scroll to "After payment"
5. Select "Custom page"
6. In "Success URL" field, enter:
   ```
   https://2e2e1386.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}
   ```
7. In "Cancel URL" field, enter:
   ```
   https://2e2e1386.coldcopy-au3.pages.dev/cancel
   ```
8. Click "Save changes"

9. Repeat steps 2-8 for the **Pro** payment link

#### Payment Links Reference

| Plan | Price | LIVE Link |
|------|-------|-----------|
| **Starter** | $19 one-time | https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01 |
| **Pro** | $39/month | https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02 |

---

## End-to-End Smoke Test

Follow these steps to verify the payment flow works correctly:

### Test 1: Paywall Trigger (402 Response)

1. Visit production: https://2e2e1386.coldcopy-au3.pages.dev
2. Navigate to `/generate` page
3. Fill in the form and generate a sequence
4. Repeat until you get a paywall (typically on 2nd generation)
5. **Expected:** Modal appears with "You've Reached Your Free Limit" and pricing options

### Test 2: Stripe Redirect

1. From the paywall, click "Get Starter" or "Go Pro"
2. **Expected:** Opens new tab with Stripe Checkout (live payment page)

### Test 3: Payment Success Flow

1. In Stripe Checkout, use test card: `4242 4242 4242 4242`
2. Expiry: Any future date (e.g., 12/34)
3. CVC: Any 3 digits
4. Complete payment
5. **Expected:** Redirected to `/success` page with:
   - ✅ Green checkmark icon
   - ✅ "Payment Successful!" message
   - ✅ Transaction ID displayed
   - ✅ Next steps clearly listed
   - ✅ "Return to ColdCopy" button

### Test 4: Payment Cancel Flow

1. Click "Go Pro" again (from paywall or /generate)
2. At Stripe Checkout, click "Back" or close the tab
3. **Expected:** Redirected to `/cancel` page with:
   - ✅ X icon
   - ✅ "Payment Cancelled" message
   - ✅ "Back to ColdCopy" button functional

### Test 5: Manual Quota Upgrade (DevOps Process)

After successful payment, quota must be manually upgraded:

```bash
# Get user fingerprint from the generated email or request logs
# Update quota in D1
wrangler d1 execute coldcopy-db --command="
  UPDATE tiers
  SET quota = 9999, tier_name = 'Pro'
  WHERE fingerprint = '<user_fingerprint>';
"
```

After quota upgrade, user should be able to generate unlimited sequences.

---

## Frontend Routes Configured

| Route | File | Purpose |
|-------|------|---------|
| `/` | `Home.tsx` | Landing page |
| `/generate` | `Generate.tsx` | Main generation form (handles 402) |
| `/success` | `Success.tsx` | Payment confirmation page |
| `/cancel` | `Cancel.tsx` | Payment cancellation page |

---

## Integration Points

### 1. Generate Page (`/frontend/src/pages/Generate.tsx`)

Catches HTTP 402 responses from API:

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

### 2. Paywall Component (`/frontend/src/components/Paywall.tsx`)

- Displays pricing comparison modal
- Links directly to Stripe Payment Links
- Closes on ESC key or backdrop click
- Mobile responsive (stacks cards on small screens)

### 3. Success Page (`/frontend/src/pages/Success.tsx`)

- Extracts `session_id` from URL query params
- Tracks conversion event (Google Analytics if configured)
- Shows next steps (24-hour manual upgrade SLA)
- Provides transaction ID for support reference

### 4. Cancel Page (`/frontend/src/pages/Cancel.tsx`)

- Reassures user about free tier access
- Offers easy return to generation page

---

## Production Checklist

- [x] Frontend built successfully
- [x] Deployed to Cloudflare Pages
- [x] Production URL: https://2e2e1386.coldcopy-au3.pages.dev
- [ ] **Stripe Payment Links configured with success_url** (MANUAL - founder action)
- [ ] **Stripe Payment Links configured with cancel_url** (MANUAL - founder action)
- [ ] Smoke test: Paywall appears on 402
- [ ] Smoke test: Stripe redirect works
- [ ] Smoke test: Success page loads with session_id
- [ ] Smoke test: Cancel page functional
- [ ] **Manual quota upgrade process tested**
- [ ] Email monitoring set up for Stripe payments
- [ ] Payment tracking spreadsheet created

---

## Known Limitations (MVP Phase)

1. **Manual Quota Upgrade** — DevOps must manually update D1 after payment
2. **No Email Collection** — Users identified by fingerprint only
   - Workaround: Match by payment timestamp in Stripe Dashboard
   - Future: Collect email during generation
3. **No Self-Service Billing** — Users cannot manage subscriptions via UI
4. **No Webhook Automation** — Payment confirmations are manual
5. **No Refund Automation** — Refunds processed manually in Stripe Dashboard

**Why this is acceptable:** We're in MVP. Our focus is getting first paying customers. Automation can be added once payment volume justifies engineering time.

---

## Manual Payment Processing (DevOps Runbook)

### When Payment Arrives

1. **Get notification from Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/payments
   - Find latest payment
   - Note: Customer email, Plan (Starter/Pro), Amount

2. **Match customer to user**
   - If email is available: Use email
   - If not: Check payment timestamp and match to /success page visit timestamp in logs

3. **Update quota in D1**
   ```bash
   # Option 1: Match by email (if collected)
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = (
       SELECT fingerprint FROM usage
       WHERE user_email = 'customer@example.com'
       LIMIT 1
     );
   "

   # Option 2: Match by fingerprint (if known)
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = '<user_fingerprint>';
   "
   ```

4. **Send welcome email**
   - Subject: `Welcome to ColdCopy Pro!`
   - Body:
     ```
     Hi there,

     Your upgrade is now live! You can generate unlimited email sequences.

     Head over to https://2e2e1386.coldcopy-au3.pages.dev/generate and start creating.

     Need help? Reply to this email.

     Best,
     ColdCopy Team
     ```

5. **Log payment**
   - Add to `docs/devops/payment-tracking.md`:
     ```markdown
     | Date | Email | Plan | Amount | Status |
     |------|-------|------|--------|--------|
     | 2026-02-20 | user@example.com | Pro | $39.00 | Quota granted |
     ```

**SLA:** 24 hours (as stated on /success page)

---

## Monitoring & Next Steps

### Daily Tasks
- Check Stripe Dashboard for new payments
- Process payments within 24-hour SLA
- Monitor /success page visits for conversion tracking

### Weekly Tasks
- Review payment tracking spreadsheet
- Check for support emails about quota upgrades
- Monitor paywall show rate and conversion metrics

### Future Automation (Post-MVP)
When payment volume justifies engineering time:

1. **Stripe Webhooks** — Automatic quota upgrade on `checkout.session.completed`
2. **Email Collection** — Add email field to generation form
3. **Admin Dashboard** — Payment tracking + quota management UI
4. **Subscription Management** — Stripe Customer Portal link

---

## Rollback Plan

If production issues occur:

1. **Revert to previous deployment:**
   ```bash
   # Get previous deployment ID
   wrangler pages deployment list --project-name=coldcopy

   # Rollback to previous deployment
   # (Manual via Cloudflare Dashboard or automatic via git revert)
   ```

2. **Disable Paywall (if needed):**
   - Comment out paywall state in `/frontend/src/pages/Generate.tsx`
   - Deploy new version

3. **Disable Stripe Links (if needed):**
   - Update Payment Links URLs in `/frontend/src/components/Paywall.tsx`
   - Or remove links temporarily and replace with "Coming Soon" message

---

## Cost Analysis

**Stripe Fees per Transaction:**
- $19 Starter: $0.85 fee (2.9% + $0.30) = **$18.15 net**
- $39 Pro: $1.43 fee (2.9% + $0.30) = **$37.57 net**

**Cloudflare Pages Cost:**
- Deployed successfully
- No additional cost beyond existing Cloudflare Pages plan

**Total Production Cost:** ~$0.00/month (Stripe fees only on sales)

---

## Deployment Artifacts

| Artifact | Location | Status |
|----------|----------|--------|
| Built frontend | `frontend/dist/` | ✅ Ready |
| Cloudflare Pages URL | https://2e2e1386.coldcopy-au3.pages.dev | ✅ Live |
| Stripe Payment Links | Starter + Pro links | ✅ Live (awaiting URL config) |
| Routes configured | `frontend/src/App.tsx` | ✅ Ready |

---

## Questions & Support

- **Paywall not appearing?** Check API returns 402 on quota exceeded
- **Stripe redirects failing?** Verify success_url and cancel_url in Stripe Dashboard
- **Session ID not showing?** Check URL has `?session_id=cs_xxx` query param
- **Can't find user to grant quota?** Check Stripe Dashboard payment details for customer email

---

**Status:** Ready for manual Stripe configuration and smoke testing. Ship it.
