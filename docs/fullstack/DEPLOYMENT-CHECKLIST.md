# ColdCopy Payment Integration — Deployment Checklist

**Review Date:** 2026-02-20
**Reviewed By:** DHH (fullstack-dhh)
**Status:** ✅ Ready for Production

---

## Pre-Deployment Verification

### Code Review
- ✅ All components implemented (`Paywall.tsx`, `Success.tsx`, `Cancel.tsx`)
- ✅ Routes configured in `App.tsx`
- ✅ 402 response handler in `Generate.tsx`
- ✅ Stripe Payment Links configured (LIVE mode)
- ✅ No console errors in development
- ✅ Mobile responsive (Tailwind + shadcn/ui)
- ✅ Accessibility (keyboard navigation, ARIA labels)

### Security
- ✅ No API keys in frontend code
- ✅ External links use `rel="noopener noreferrer"`
- ✅ No sensitive data in sessionStorage
- ✅ Form validation before API calls
- ✅ Server-side quota enforcement (402 response)

### UX/UI
- ✅ Paywall modal triggers on 402
- ✅ Clear pricing display (Starter vs Pro)
- ✅ Success page has clear next steps
- ✅ Cancel page is non-judgmental
- ✅ All CTAs functional
- ✅ Loading states implemented

---

## Deployment Steps

### 1. Build Frontend
```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy/frontend
npm run build
```

**Expected Output:**
```
✓ built in XXXms
dist/index.html
dist/assets/...
```

### 2. Test Build Locally (Optional)
```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy/frontend
npm run preview
# Visit http://localhost:4173
```

### 3. Deploy to Cloudflare Pages
```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy
git add .
git commit -m "feat: Stripe Payment Links integration — paywall, success, cancel pages"
git push origin main
```

**Cloudflare Auto-Deploy:**
- Listens to `main` branch pushes
- Builds `frontend/` directory
- Deploys to production URL
- Updates live site in ~2-3 minutes

### 4. Verify Production URL

**Production URL:** `https://70eb60c3.coldcopy-au3.pages.dev`

**Test Checklist:**
- [ ] Visit `/generate` → form loads
- [ ] Fill form → submit (should work if quota available)
- [ ] Try 2nd generation (should trigger 402 → paywall)
- [ ] Click "Get Starter" → Stripe Checkout opens
- [ ] Click "Go Pro" → Stripe Checkout opens
- [ ] Complete test payment (use test card `4242 4242 4242 4242`)
- [ ] Verify redirect to `/success?session_id=...`
- [ ] Check Stripe dashboard for payment
- [ ] Navigate to `/cancel` → cancel page displays

---

## Post-Deployment Monitoring

### Stripe Dashboard
- Log in to Stripe dashboard
- Go to **Payments** tab
- Filter by **Payment Links**
- Watch for first payment

### Cloudflare Analytics
- Check `/generate` traffic
- Monitor `/success` page views (conversion rate)
- Track `/cancel` page views (abandonment rate)

### Error Monitoring
- Check browser console for errors
- Monitor backend logs for 402 responses
- Watch for failed payments in Stripe

---

## Rollback Plan

**If critical issue found:**

```bash
# Revert to previous deployment
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy
git revert HEAD
git push origin main
```

Cloudflare will auto-deploy previous version in ~2-3 minutes.

**Alternatively:**
- Go to Cloudflare Pages dashboard
- Click "Deployments"
- Find previous successful deployment
- Click "Rollback to this deployment"

---

## Success Metrics (Week 1)

Track these metrics to validate integration:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Paywall Views | >0 | Backend logs (402 responses) |
| Stripe Checkout Opens | >0 | Stripe dashboard (Payment Link clicks) |
| Payments Completed | ≥1 | Stripe dashboard (Payments) |
| Success Page Views | ≥1 | Cloudflare Analytics |
| Cancel Rate | <80% | (Cancels / Checkout Opens) |

---

## Known Limitations (MVP)

These are **acceptable** for MVP. Improve later if needed:

1. **Manual Quota Update:**
   - After payment, admin manually updates user quota
   - Timeline: within 24 hours
   - **Fix Later:** Stripe webhook → auto-update quota

2. **No Email Capture:**
   - Users enter email in Stripe Checkout
   - No pre-fill from frontend
   - **Fix Later:** Add email field to form, pass to Stripe API

3. **Hardcoded Payment Links:**
   - Links in `Paywall.tsx` (lines 33-34)
   - No environment variables
   - **Fix Later:** Move to `.env` if price changes frequently

4. **No A/B Testing:**
   - Single pricing page
   - No variant testing
   - **Fix Later:** Add feature flags for pricing experiments

5. **No Conversion Tracking:**
   - Basic gtag tracking (if present)
   - No FB Pixel, LinkedIn Insight
   - **Fix Later:** Add marketing pixels after first 10 sales

---

## Support Readiness

### User Questions

**"I paid but still see paywall"**
→ "Quota updates within 24 hours. Check your email for confirmation."

**"Stripe link doesn't work"**
→ Verify links in `Paywall.tsx` match Stripe dashboard

**"Payment declined"**
→ "Check with your bank. Stripe requires 3D Secure for some cards."

**"Can I get a refund?"**
→ Handle via Stripe dashboard (Refunds tab)

### Admin Actions

**Verify Payment:**
1. Go to Stripe dashboard
2. Find payment by customer email
3. Check transaction ID matches `/success?session_id=...`

**Update Quota:**
1. Access backend admin panel (or database)
2. Find user by email (from Stripe)
3. Update `quota_remaining` field
4. Send welcome email with instructions

---

## Environment Variables (Future)

**Currently:** None required (Payment Links are hardcoded)

**If externalizing later:**

```bash
# .env.production
VITE_STRIPE_STARTER_LINK=https://buy.stripe.com/...
VITE_STRIPE_PRO_LINK=https://buy.stripe.com/...
```

Update `Paywall.tsx`:
```typescript
const STARTER_LINK = import.meta.env.VITE_STRIPE_STARTER_LINK;
const PRO_LINK = import.meta.env.VITE_STRIPE_PRO_LINK;
```

---

## Documentation References

- **Full Integration Review:** `docs/fullstack/PAYMENT-INTEGRATION-COMPLETE.md`
- **Sales Strategy:** `docs/sales/COLDCOPY-MONETIZATION-READY.md`
- **Stripe Payment Links:** `docs/sales/STRIPE-PAYMENT-LINKS-LIVE.md`
- **Backend Quota Logic:** Backend source code (402 response implementation)

---

## Sign-Off

**DHH (fullstack-dhh):**
✅ Code quality approved
✅ Security reviewed
✅ UX validated
✅ Ready for production deployment

**Next Step:** DevOps agent deploys to Cloudflare Pages

---

**End of Checklist**
