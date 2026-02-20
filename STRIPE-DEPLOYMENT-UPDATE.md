# URGENT: Update Stripe Payment Links URLs

**Status:** Frontend deployed ✅ | Stripe URLs need update ⚠️
**Action Required By:** Founder
**Time Required:** 5 minutes

---

## The Problem

The frontend is now deployed to a NEW URL:
```
https://e937fb4b.coldcopy-au3.pages.dev
```

But the Stripe Payment Links still point to the OLD URL:
```
https://2e2e1386.coldcopy-au3.pages.dev  ← OUTDATED
```

**Result:** When customers complete payment, they'll be redirected to the old (broken) success page.

---

## Solution: Update Stripe Dashboard (Manual)

### Option A: Dashboard GUI (Easiest)

1. Go to **https://dashboard.stripe.com**
2. Click **Products** (left sidebar)
3. Find product **"ColdCopy Starter"**
4. Scroll down to **"Payment Links"** section
5. Click the link button to open it
6. Click **"Edit"** (top right)
7. Find section **"After payment"**
8. Select **"Custom URL"** (if not already selected)
9. In **"Redirect URL"** field, paste:
   ```
   https://e937fb4b.coldcopy-au3.pages.dev/success?session_id={CHECKOUT_SESSION_ID}
   ```
   (Keep the `{CHECKOUT_SESSION_ID}` — Stripe replaces it automatically)

10. Click **"Save changes"**
11. **REPEAT steps 3-10 for "ColdCopy Pro"** product
12. Done! ✅

### Option B: API Script (For Automation Lovers)

1. Get your Stripe Secret Key from Dashboard
2. Find the payment link IDs:
   - Go to Stripe Dashboard → Products
   - Click "ColdCopy Starter" → Copy the payment link URL
   - Extract ID from: `https://buy.stripe.com/[ID]`
   - Repeat for Pro

3. Run the update script:
   ```bash
   cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy

   python3 update-stripe-urls.py \
     sk_live_YOUR_SECRET_KEY \
     plink_STARTER_ID \
     plink_PRO_ID \
     https://e937fb4b.coldcopy-au3.pages.dev
   ```

4. Verify output shows "SUCCESS: Payment links updated!"

---

## Verify It Works

After updating:

1. Visit: **https://e937fb4b.coldcopy-au3.pages.dev/generate**
2. Click "Generate Sequence" → Use your free quota (3 free)
3. Click again → Should see **Paywall modal** appear
4. Click **"Go Pro"** or **"Get Starter"**
5. **New Stripe Checkout opens** → Good! ✅
6. Do NOT complete payment yet — just verify the page loads
7. Click **X** to close or **Cancel** button
8. Should redirect to: **https://e937fb4b.coldcopy-au3.pages.dev/cancel**
9. If yes, you're done! ✅

---

## Test Full Payment Flow

To verify the complete flow works:

1. Go through steps above (open Stripe Checkout)
2. Use **test card:** `4242 4242 4242 4242`
3. **Expiry:** `12/34`
4. **CVC:** `123` (any 3 digits)
5. **Name:** Anything (e.g., "Test Customer")
6. Click **"Pay"**
7. **Should redirect to:**
   ```
   https://e937fb4b.coldcopy-au3.pages.dev/success?session_id=cs_test_...
   ```
8. **Success page shows:**
   - "Payment Successful!" ✅
   - Session ID displayed
   - "Your quota upgrade is being processed..."
   - Link to return to app

If all above works → Payment integration is live! 🎉

---

## Production Payment Links

Once Stripe URLs are updated, these links are LIVE and ready for real customers:

| Plan | Price | Link |
|------|-------|------|
| **Starter** | $19 one-time | https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01 |
| **Pro** | $39/month | https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02 |

**Warning:** Use LIVE card (not test card) to process real payments.

---

## When First Customer Pays

1. **Stripe Dashboard** will show payment notification
2. Note the customer details (email, session_id)
3. Run quota upgrade:
   ```bash
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = '<customer_fingerprint>';
   "
   ```
   (Or ask DevOps for help if email not collected)

4. Send welcome email:
   ```
   Subject: Welcome to ColdCopy Pro!

   Thanks for upgrading! Your quota is now unlimited.

   Generate unlimited cold email sequences at:
   https://e937fb4b.coldcopy-au3.pages.dev/generate

   Questions? Reply to this email.
   ```

5. Document in spreadsheet for tracking

---

## Troubleshooting

### Payment completes but no redirect to /success
- **Check:** Did you update the Stripe Dashboard URL?
- **Fix:** Go to Products → Payment Link → Edit → Set success URL again
- **Wait:** Changes take ~5 minutes to propagate

### Users can't see the paywall
- **Check:** Are you generating >3 sequences? (First 3 are free)
- **Fix:** Generate 4+ sequences to trigger paywall
- **Test:** Check browser console for API errors

### Test payment shows error on checkout
- **Check:** Did you use test card `4242 4242 4242 4242`?
- **Fix:** Stripe test mode only accepts test cards, not real cards
- **Reference:** https://stripe.com/docs/testing

### Session ID not in URL after payment
- **Check:** Did you configure the `{CHECKOUT_SESSION_ID}` variable?
- **Fix:** Make sure success URL contains exact text: `{CHECKOUT_SESSION_ID}`
- **Stripe replaces this automatically** — don't manually enter it

---

## Timeline

```
NOW     ✅ Frontend deployed to e937fb4b.coldcopy-au3.pages.dev
+5min   Update Stripe URLs in Dashboard (YOU DO THIS)
+10min  Test payment flow with test card (YOU DO THIS)
+15min  ✅ Full payment integration is live!
```

---

## Success Checklist

- [ ] Logged into Stripe Dashboard
- [ ] Updated Starter payment link success URL
- [ ] Updated Pro payment link success URL
- [ ] Visited /generate page
- [ ] Triggered paywall (3+ sequences)
- [ ] Clicked payment link
- [ ] Verified Stripe Checkout loads
- [ ] Used test card, completed payment
- [ ] Redirected to /success with session_id
- [ ] Success page displayed correctly
- [ ] Ready to accept first real customer!

---

## Questions?

- **Payment link not updating?** Check that you're editing the correct Payment Link (not the product)
- **Redirect not working?** Ensure URL format is exactly: `https://domain/success?session_id={CHECKOUT_SESSION_ID}`
- **Test card rejected?** Make sure Stripe is in Test Mode (toggle in top right of Dashboard)

---

**Do this NOW. It takes 5 minutes. Then you're ready to ship.** 🚀

---

Last updated: 2026-02-20 11:35 UTC
