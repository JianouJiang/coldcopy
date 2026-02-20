# ColdCopy — Quick Deployment Guide

## Deploy Frontend to Production

```bash
# 1. Build
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy/frontend
npm run build

# 2. Deploy to Cloudflare Pages
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy
wrangler pages deploy frontend/dist --project-name=coldcopy

# 3. Verify
curl -I https://coldcopy.app
# Should return 200 OK
```

## Configure Stripe Payment Links

**Before accepting payments, set the success URL:**

1. Go to https://dashboard.stripe.com/payment-links
2. Click **Starter Payment Link** (`price_1Qkw...`)
3. Edit → After payment
4. Set **Success URL**: `https://coldcopy.app/success?session_id={CHECKOUT_SESSION_ID}`
5. Set **Cancel URL**: `https://coldcopy.app/cancel`
6. Save
7. Repeat for **Pro Payment Link**

## Test Payment Flow

```bash
# Test in Stripe Test Mode first:
1. Create test Payment Links in Stripe Dashboard (Test Mode)
2. Temporarily update Paywall.tsx with test links
3. Deploy: wrangler pages deploy frontend/dist --project-name=coldcopy-staging
4. Test with card: 4242 4242 4242 4242
5. Verify redirect to /success
6. Restore live Payment Links
7. Deploy to production
```

## Manual Quota Upgrade (First Customers)

When payment notification arrives:

```bash
# Update user's quota in D1
wrangler d1 execute coldcopy-db --command="
  UPDATE tiers
  SET quota = 9999, tier_name = 'Pro'
  WHERE fingerprint = '<fingerprint>';
"

# Send welcome email
# Subject: Welcome to ColdCopy Pro!
# Your unlimited quota is now active.
```

**SLA:** Within 24 hours

## Monitoring

Daily checks:
- Stripe Dashboard → Payments (new purchases?)
- Cloudflare Analytics → Traffic/errors
- User feedback emails

## Local Development

```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy/frontend
npm run dev
```

Open http://localhost:5173

---

**That's it.** Ship it and iterate.
