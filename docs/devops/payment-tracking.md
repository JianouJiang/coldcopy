# Payment Tracking & Quota Upgrade Log

**Purpose:** Track all payments and quota upgrades for MVP phase (manual processing)

---

## Payment Log

| Date | Time | Email | Plan | Amount (USD) | Stripe Fee | Net Revenue | Fingerprint | Quota Status | Notes |
|------|------|-------|------|--------------|------------|-------------|-------------|--------------|-------|
| — | — | — | — | — | — | — | — | — | *Awaiting first customer* |

---

## Quota Upgrade Log

| Date | Time | Email | Fingerprint | New Quota | Tier | Welcome Email Sent | Notes |
|------|------|-------|-------------|-----------|------|-------------------|-------|
| — | — | — | — | — | — | — | *Awaiting first customer* |

---

## Instructions for Manual Processing

### When Payment Arrives

1. **Find payment in Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/payments
   - Find the transaction

2. **Extract details:**
   - Email (if available)
   - Plan (Starter $19 or Pro $39)
   - Amount
   - Timestamp

3. **Update this file** with payment entry

4. **Match customer to fingerprint:**
   ```bash
   # If email is available:
   wrangler d1 execute coldcopy-db --command="
     SELECT fingerprint FROM usage
     WHERE user_email = 'customer@example.com'
     LIMIT 1;
   "
   ```

5. **Grant quota** in D1:
   ```bash
   wrangler d1 execute coldcopy-db --command="
     UPDATE tiers
     SET quota = 9999, tier_name = 'Pro'
     WHERE fingerprint = '<user_fingerprint>';
   "
   ```

6. **Log the upgrade** (add entry to "Quota Upgrade Log" table above)

7. **Send welcome email:**
   ```
   Subject: Welcome to ColdCopy Pro!

   Hi there,

   Your upgrade is now live! You can generate unlimited email sequences.

   Head over to https://2e2e1386.coldcopy-au3.pages.dev/generate and start creating.

   Need help? Reply to this email.

   Best,
   ColdCopy Team
   ```

8. **Check off** "Welcome Email Sent" column

---

## Metrics to Track

- **Paywall Show Rate:** (402 responses / total API calls)
- **Payment Success Rate:** (completed payments / paywall clicks)
- **Conversion Rate:** (paying customers / total visitors)
- **Average Revenue Per User:** (total revenue / unique users)
- **Churn Rate:** (cancelled subscriptions / active subscriptions)

---

## Issues & Troubleshooting

| Issue | Solution |
|-------|----------|
| Customer email not available | Check Stripe payment details for email, or match by timestamp |
| Can't find user fingerprint | Check Stripe Dashboard for session_id, cross-reference with /success page logs |
| Payment processed but user still sees 402 | Verify quota update ran successfully in D1 |
| Welcome email bounces | Check email address in Stripe Dashboard |

---

## SLA

- **Quota Upgrade:** Within 24 hours of payment (as stated on /success page)
- **Welcome Email:** Within 1 hour of quota upgrade
- **Support Response:** Within 24 hours

---

**Last Updated:** 2026-02-20 (Initial template created)
