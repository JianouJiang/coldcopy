# Stripe Integration — Deployment Checklist

**Status:** Frontend Ready ✅ → DevOps Action Required ⏳

---

## DevOps: Do These 3 Things

### 1. Update Stripe Payment Link URLs

**Production URL:** `https://3bcc41e1.coldcopy-au3.pages.dev`

**Steps:**
1. Log in to Stripe Dashboard: https://stripe.com
2. Go to: Products → Payment Links
3. Edit **"ColdCopy Starter"** link:
   - Success URL: `https://3bcc41e1.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `https://3bcc41e1.coldcopy-au3.pages.dev/cancel`
4. Edit **"ColdCopy Pro"** link:
   - Same URLs ↑
5. Save both

---

### 2. Test End-to-End (5 minutes)

**Quick test:**
```bash
# 1. Open production site
open https://3bcc41e1.coldcopy-au3.pages.dev/generate

# 2. Submit form (use up free quota)
# 3. See paywall modal appear
# 4. Click "Get Starter"
# 5. Stripe opens → Use test card: 4242 4242 4242 4242
# 6. Complete payment
# 7. Redirects to /success?session_id=...
# 8. Verify success page loads correctly
```

**Expected result:** Success page shows "Payment Successful!" + session ID in URL.

---

### 3. Document First Payment Process

When first real customer pays:

1. Check Stripe Dashboard for payment
2. Get session ID
3. Match to user fingerprint in D1 database
4. Run upgrade command:
   ```bash
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = '<fingerprint>';
   "
   ```
5. Send welcome email to customer
6. Document time-to-upgrade (goal: <1 hour)

**See:** `/docs/fullstack/stripe-testing-guide.md` for full testing scenarios.

---

## Files to Reference

| File | Purpose |
|------|---------|
| `/docs/fullstack/STRIPE-INTEGRATION-SUMMARY.md` | Executive summary |
| `/docs/fullstack/stripe-integration.md` | Technical details |
| `/docs/fullstack/stripe-testing-guide.md` | Complete testing checklist |
| `/docs/sales/stripe-payment-links-live.md` | Payment Links + pricing strategy |

---

## Success Criteria

- [ ] Stripe URLs updated to production domain
- [ ] Test payment completes successfully
- [ ] Success page receives session_id parameter
- [ ] Cancel page loads after checkout cancel
- [ ] Mobile layout works (no scroll issues)

**When all checked:** ✅ Integration complete. Ready for first customer.

---

**Estimated time:** 30 minutes (update URLs + test).

**Next:** Monitor first payment, upgrade quota, collect feedback.
