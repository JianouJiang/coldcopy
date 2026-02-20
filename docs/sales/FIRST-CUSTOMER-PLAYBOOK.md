# First Customer Playbook — Quick Reference

**For:** Operations, DevOps, Sales
**When:** First payment arrives in Stripe Dashboard
**Goal:** Get customer paying → quota upgraded → generating → delighted within 24 hours

---

## The Moment (Payment Received)

### What You'll See in Stripe Dashboard
1. New "Payment" in Stripe Dashboard (payments page)
2. Amount: $19 or $39
3. Status: Succeeded
4. Session ID: cs_test_xxx or cs_live_xxx
5. Email: Might be included in metadata (if customer provided it)
6. Timestamp: When payment was processed

---

## What To Do (Step-by-Step)

### Step 1: Verify Payment (30 seconds)
1. Go to Stripe Dashboard → Payments
2. Click the payment entry
3. Confirm:
   - Amount is correct ($19 or $39)
   - Status = "Succeeded"
   - Customer email (if provided)
   - Session ID

**Copy the Session ID** — you'll need it to confirm with customer.

---

### Step 2: Identify Customer (2 minutes)
This is the hard part MVP because we don't collect email during generation.

**Option A: Customer provided email**
- Stripe metadata might contain email
- Use that email to identify them

**Option B: Email from success page**
- Customer might email you with subject "Welcome to ColdCopy Pro"
- Look for recent email mentioning session ID or payment

**Option C: Match by timestamp + user agent**
- Go to production logs (Cloudflare Analytics)
- Find the user session that generated payment link click
- Match by timestamp (~within 10 minutes of payment)
- Last resort: Ask customer for email in welcome message

**Pro tip:** Once you identify them, you now know their fingerprint (stored in browser cookies). Save this for future.

---

### Step 3: Upgrade Quota in D1 (1 minute)
Once you identify the customer's fingerprint, upgrade their quota:

```bash
# Login to Cloudflare
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy

# For Starter customers ($19 one-time = 50 more sequences)
wrangler d1 execute coldcopy-db --command="
  UPDATE tiers
  SET quota = quota + 50
  WHERE fingerprint = '<CUSTOMER_FINGERPRINT>';
"

# For Pro customers ($39/month = unlimited)
wrangler d1 execute coldcopy-db --command="
  UPDATE tiers
  SET quota = 9999, tier_name = 'Pro'
  WHERE fingerprint = '<CUSTOMER_FINGERPRINT>';
"
```

**Verify it worked:**
```bash
wrangler d1 execute coldcopy-db --command="
  SELECT fingerprint, quota, tier_name FROM tiers WHERE fingerprint = '<CUSTOMER_FINGERPRINT>';
"
```

Output should show:
- Starter: quota = original + 50
- Pro: quota = 9999, tier_name = 'Pro'

---

### Step 4: Send Welcome Email (2 minutes)

**To:** Customer's email (from Stripe or reply to their inquiry)
**Subject:** "Welcome to ColdCopy Pro! 🚀"
**Body:**

```
Hi [Name],

Your payment of $[19 or 39] has been processed! ✅

Your ColdCopy account is now upgraded:

• Starter plan: 50 sequences added
• Pro plan: Unlimited sequences for 30 days

Head back to https://coldcopy.app/generate and start generating. Your quota is live now.

Questions? Reply to this email.

Cheers,
ColdCopy Team
```

---

### Step 5: Track in Spreadsheet (1 minute)

Create a spreadsheet (Google Sheets or local CSV) with columns:

| Date | Customer Email | Session ID | Plan | Amount | Fingerprint | Quota Updated | Notes |
|------|------------------|------------|------|--------|-------------|---------------|-------|
| 2026-02-21 | customer@example.com | cs_live_xxx | Pro | $39 | abc123xyz | ✓ | N/A |
| 2026-02-22 | unknown | cs_live_yyy | Starter | $19 | def456uvw | ✓ | Matched by timestamp |

**Why:** Track everything for revenue reporting, churn analysis, cohort analysis later.

---

## Timeline

**When Payment Arrives:**
- T+0: Notification (Stripe email)
- T+0-30: Verify payment
- T+30-150: Identify customer
- T+150-210: Upgrade quota
- T+210-330: Send welcome email

**Total SLA: 24 hours** (promise to customer is "within 24 hours")

**Better: < 1 hour** (delight them with speed)

---

## If Customer Can't Be Identified

### Scenario: Payment succeeded but no email provided

**Fallback sequence:**
1. Watch ColdCopy logs for new session after payment timestamp
2. If found: Use that fingerprint to upgrade
3. If not found: Send generic welcome email:

   "Thanks for upgrading to ColdCopy! Your quota is now [upgraded]. We couldn't auto-match your account, so reply to this email with your session ID (in your Stripe receipt) and we'll upgrade within 30 minutes."

4. Customer replies → You match → Upgrade
5. Send follow-up: "All set! You're ready to generate unlimited sequences."

---

## If Payment Failed (Refund Request)

### Scenario: Customer disputes charge or wants refund

**Process:**
1. Check Stripe Dashboard for charge details
2. If within 7 days: Issue refund from Stripe Dashboard
   - Stripe Dashboard → Payment → Refund
   - Full or partial refund? (Customer decides)
3. If >7 days: Respond with "Refunds available within 7 days. Please contact us if there's an issue."
4. Send refund confirmation email

**Never debate refunds with customers.** Process fast, explain once.

---

## If Customer Already Paid But Wants to Upgrade

### Scenario: Starter customer ($19) wants to go Pro ($39/month)

**No upgrade mechanism in MVP** — do this manually:

1. Customer emails: "I want to upgrade to Pro"
2. You respond: "Sure! Go to https://buy.stripe.com/[PRO_LINK] and complete payment"
3. Customer pays $39
4. You update their quota to 9999
5. Send: "Welcome to ColdCopy Pro! Unlimited sequences starting now."

**Future:** Implement Stripe billing portal for self-service (Phase 2)

---

## If Customer Can't Generate After Payment

### Scenario: Customer upgraded but still sees "quota exceeded" message

**Troubleshoot:**

1. **Check quota in D1:**
   ```bash
   wrangler d1 execute coldcopy-db --command="
     SELECT quota FROM tiers WHERE fingerprint = '<FINGERPRINT>';
   "
   ```
   - If quota = 9999 or >50: Database is correct ✓
   - If quota = 1: Database not updated ✗ → Re-run update command

2. **Check browser cache:**
   - Tell customer: "Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)"
   - Browser might be caching old quota

3. **Check session persistence:**
   - Ask: "Did you try a different browser or computer?"
   - New device = new fingerprint = different session
   - Solution: Customer logs back in on original device OR pay again (rare)

4. **Last resort:**
   - Ask customer for screenshot of error
   - Check production logs in Cloudflare
   - Verify API is returning correct quota in GET /api/session response

---

## Metrics to Watch

After each payment:
- [ ] Time from payment to quota upgrade
- [ ] Time from payment to welcome email
- [ ] Email response rate (if customer replies)
- [ ] Repeat purchase rate (do they come back?)

**Track weekly:** Total customers, total MRR, churn rate (cancellations)

---

## Common Questions from Customers

### "I paid but the quota didn't update?"
"Great question! Quota upgrades are processed manually and usually take <1 hour. We'll send you a confirmation email once it's live. If you don't see it in the next 24 hours, reply to this email with your session ID."

### "Can I cancel my subscription?"
"Of course! Stripe manages cancellations. Go to your Stripe email receipt, click the subscription link, or reply here with your session ID and we'll cancel it. Your plan stays active through the end of your billing period."

### "I want a refund"
"No problem! We offer refunds within 7 days of purchase. What's your session ID or the email you used? We'll process it immediately."

### "Can I upgrade from Starter to Pro?"
"Absolutely! Just click the link to go Pro: [LINK]. Pay $39/month and you'll have unlimited sequences. Reply with your new session ID after paying and we'll upgrade your account."

---

## Pro Tips

1. **Fast > Perfect** — Upgrade quota in 10 minutes if possible, not 24 hours. Delight customers.
2. **Over-communicate** — Send email confirmation, even if it seems obvious.
3. **Collect email always** — Next feature: Email field in generation form. This makes everything easier.
4. **Log fingerprints** — When you identify a customer, save fingerprint + email for faster lookup next time.
5. **Celebrate wins** — First customer paying is a huge deal. Share it with the team.

---

## Checklists

### Payment Received Checklist
- [ ] Payment verified in Stripe (amount, status, session ID)
- [ ] Customer identified (email, fingerprint, or timestamp)
- [ ] Quota upgraded in D1
- [ ] Quota verified correct in database
- [ ] Welcome email sent
- [ ] Tracked in spreadsheet
- [ ] Customer can generate successfully (follow-up in email: "Let us know if you hit any snags!")

### Weekly Review Checklist
- [ ] How many payments? (MRR = sum of Pro monthly, plus Starter)
- [ ] Average time quota upgrade (goal: <1 hour)
- [ ] Any refunds? (track refund rate)
- [ ] Any churns? (track churn rate)
- [ ] Any support issues? (document for next cycle)

---

## When In Doubt

1. **Verify payment in Stripe first** — Is the charge actually successful?
2. **Track in spreadsheet** — Even if you're not sure what to do, at least record it.
3. **Email customer immediately** — Acknowledging them > silence
4. **Give generous deadline** — "Your upgrade is live" > "We're working on it"
5. **Ask for feedback** — "How are the generated sequences? Any feedback?" (builds relationship)

---

## Next Level: Retention

Once quota is upgraded, these customers need:

1. **Day 1:** Welcome email (you're here)
2. **Day 3:** Check-in: "How are the sequences working? Reply with questions."
3. **Day 7:** Engagement trigger: "Pro customers average 200+ sequences/month. You've generated X. Tips to scale: [link]"
4. **Day 30:** Retention question: "Staying with us? Feedback welcome."
5. **Day 60:** Upsell opportunity: "Try the Team Plan ($99/month for 5 team members)"

---

**Status:** Ready for first customer.
**Playbook owner:** Operations (Paul Graham), Sales (Aaron Ross)
**Last updated:** 2026-02-20

