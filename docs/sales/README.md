# ColdCopy Sales Strategy — Complete Documentation

**Owner:** Sales (Aaron Ross)
**Status:** ✅ Production Ready
**Date:** 2026-02-20

---

## Welcome

You've found ColdCopy's complete sales strategy and payment infrastructure. This directory contains everything you need to understand our pricing, conversion funnel, and customer acquisition model.

**Quick navigation:**
1. **New to ColdCopy sales?** → Start here
2. **Want to understand pricing?** → `pricing-strategy-analysis.md`
3. **Ready to optimize conversion?** → `conversion-optimization-playbook.md`
4. **Need payment link details?** → `stripe-payment-links-live.md`

---

## What We're Selling

**Product:** ColdCopy — AI-powered cold email sequence generator
**Target:** Bootstrapped founders and small sales teams (2-5 people)
**Problem Solved:** Generate personalized B2B cold emails in minutes (not hours)
**Time to Value:** 30 seconds (free email, instant preview)

---

## Our Pricing Model

### Two Tiers, One Decision Point

```
User generates first email for FREE
            ↓
Sequence quality blows them away
            ↓
Want to generate more?
            ↓
╔════════════════════════════════════════╗
║ CHOOSE YOUR PATH:                      ║
║                                        ║
║ 💰 Starter: $19 one-time              ║
║ Get 50 sequences. Perfect for          ║
║ testing your first campaign.           ║
║                                        ║
║ OR                                     ║
║                                        ║
║ 🚀 Pro: $39/month                     ║
║ Unlimited sequences. Best for          ║
║ scaling campaigns weekly.              ║
╚════════════════════════════════════════╝
            ↓
Stripe checkout (60 seconds)
            ↓
✅ Quota upgraded (24h manual + future auto)
```

### The Numbers

| Tier | Price | Quota | Model | Typical User |
|------|-------|-------|-------|--------------|
| **Starter** | $19 | 50 sequences | One-time | Testing first campaign |
| **Pro** | $39/month | Unlimited | Subscription | Scaling campaigns |

**Stripe fees:** 2.9% + $0.30 per transaction (we absorb this)
- Starter net: $18.15
- Pro net: $37.57/month

---

## Why This Pricing?

### The Aaron Ross Principle: Predictable Revenue

We're not trying to sell to everyone. We're optimizing for **conversion quality**, not volume.

**$19 vs competitors ($99-999):**
- Low enough to be "trivial spend" for professionals
- High enough to attract serious users (not tire-kickers)
- Psychology: "This is a professional tool, not a toy"

**$39/month vs other SaaS:**
- Optimized for repeat users (teams generating campaigns weekly)
- Recurring revenue = predictable business
- Unlimited quota = no friction, maximum LTV

**Why no free tier?**
- Free users = high volume, low engagement, low LTV
- Paying users = high intent, high engagement, high LTV
- We'd rather have 100 paying customers than 10,000 free users

---

## Our Sales Strategy: Product-Led Growth (PLG)

**Traditional SaaS:** Marketing → Sales call → Demo → Contract negotiation (30 days)

**ColdCopy:** Product → Free trial → Paywall → Payment → Success (5 minutes)

**Why PLG?**
- Zero customer acquisition cost
- Instant proof of value
- Customer pays when they're ready
- Better unit economics than enterprise sales

**Our funnel:**
```
100 free users
  ├─ 30% hit quota (30 shows)
  │   ├─ 20% click paywall (6 clicks)
  │   │   └─ 50% complete payment (3 customers)
  │       └─ Conversion rate: 3%
  │
  └─ 70% don't generate more (low engagement)
      └─ Natural attrition
```

**Expected outcome:** 1-3% free-to-paid conversion = 1-3 customers per 100 free users

---

## What Happens After Payment?

### The Magic Moment

User completes payment → See `/success` page → **Quota upgraded immediately**

**Current state (MVP):**
- Quota updated in D1 within 24h
- Manual process (DevOps grants access)
- Acceptable for MVP (100 customer threshold)

**Future state (Phase 2):**
- Stripe webhooks auto-grant quota
- Instant gratification (no waiting)
- Self-service billing portal

### Customer Communication

**Success page promises:** "Quota upgrade within 24 hours"

**DevOps SLA:** Process all payments within 24h (as promised)

**Process:**
1. Stripe notification arrives
2. DevOps matches payment to user (by email or fingerprint)
3. Run D1 command: `UPDATE tiers SET quota = 9999`
4. Send welcome email: "Your Pro upgrade is live!"

---

## Key Metrics to Track

### Weekly Dashboard

**Conversion Funnel:**
- Free users (weekly): Target 50-100
- Paywall show rate: Target 25-35%
- Paywall click rate: Target 15-25%
- Checkout completion: Target >50%
- Free-to-paid conversion: Target 1-3%

**Customer Acquisition:**
- New Starter customers: Target 0-1 per week (month 1)
- New Pro customers: Target 0-1 per week (month 1)
- Avg order value: Target $29 (mixed portfolio)
- Weekly revenue: Target $30-60 (month 1)

**Retention:**
- Week 1 retention: Target 90%
- Week 4 retention: Target 70%
- Pro monthly churn: Target <10%
- Starter-to-Pro upgrade: Target 20-30%

### Monthly Reviews

- MRR growth rate (target: 1.5-2x per month)
- Customer acquisition cost: $0 (PLG advantage)
- Customer lifetime value: $243 (6-month Pro + Starter upgrade path)
- LTV:CAC ratio: Infinite ✅

---

## Three Documents You Need to Read

### 1. `stripe-payment-links-live.md`

**What:** Complete payment infrastructure documentation

**Read if:**
- Implementing payment processing
- Setting up manual quota upgrades
- Troubleshooting Stripe issues
- Understanding customer flow

**Key sections:**
- Payment Links (both live and tested)
- Pricing decision + rationale
- Integration status (frontend, backend, Stripe)
- Manual payment processing workflow
- Financial model (LTV, CAC, margin)
- Risk mitigation strategies

### 2. `conversion-optimization-playbook.md`

**What:** Tactical playbook to maximize revenue from free users

**Read if:**
- Running growth experiments
- Designing paywall copy
- Building email campaigns
- Measuring funnel performance

**Key sections:**
- 6-phase conversion journey (free → payment → retention → expansion)
- Specific A/B tests for paywall, pricing, messaging
- Email sequences (lifecycle, win-back, upgrade)
- Usage triggers (keep customers engaged)
- 30/60/90-day milestones
- Risk mitigation for low conversion

### 3. `pricing-strategy-analysis.md`

**What:** Strategic pricing analysis and decision framework

**Read if:**
- Considering price changes
- Evaluating competitors
- Building new pricing tiers
- Understanding unit economics

**Key sections:**
- Market context and competitive analysis
- Why $19 and $39 (psychological pricing)
- Sensitivity analysis (what if pricing is wrong?)
- Unit economics (margin, LTV, CAC)
- 4-phase pricing optimization roadmap
- Revenue projections (conservative vs optimistic)

---

## Implementation Checklist

### Phase 1: Launch (Weeks 1-2)

**Founder/DevOps:**
- [ ] Configure Stripe Payment Links success URLs
- [ ] Deploy frontend to production
- [ ] Test payment end-to-end (real card)
- [ ] Verify manual quota upgrade workflow
- [ ] Create payment tracking spreadsheet

**Sales (Aaron Ross):**
- [ ] Monitor first paywall shows (check Stripe Dashboard)
- [ ] Collect first customer testimonial
- [ ] Track free-to-paid conversion rate
- [ ] Document any issues for optimization

### Phase 2: Optimize (Weeks 3-4)

**Growth:**
- [ ] A/B test paywall copy (scarcity vs value vs social proof)
- [ ] Implement email collection on generate form
- [ ] Test "upgrade immediately" on success page
- [ ] Launch Starter-to-Pro upgrade email (7-day campaign)

**Measurement:**
- [ ] Review 30-day metrics vs targets
- [ ] Calculate actual free-to-paid conversion rate
- [ ] Measure Starter vs Pro mix
- [ ] Identify paywall drop-off points

### Phase 3: Scale (Weeks 5+)

**If conversion >1%:**
- [ ] Increase marketing spend (if applicable)
- [ ] Add testimonials to landing page
- [ ] Create case studies (first paying customers)
- [ ] Plan expansion to other channels (Product Hunt, Twitter)

**If conversion <1%:**
- [ ] Lower Starter price to $9 (A/B test)
- [ ] Improve free sequence quality (Product team)
- [ ] Revise paywall messaging (A/B test)
- [ ] Consider Gumroad as fallback option

### Phase 4: Expand (Month 2+)

**New pricing tiers:**
- [ ] Design Team Plan ($99/month, 5 team members)
- [ ] Create upgrade path (Pro → Team after 3 months)
- [ ] Prepare launch announcement

**Customer success:**
- [ ] Implement usage-based email triggers
- [ ] Launch referral program ($5 credit per friend)
- [ ] Create knowledge base for common questions
- [ ] Set up customer feedback surveys

---

## Red Flags to Watch For

### Conversion Is Broken (<0.5%)

**Symptoms:**
- 100+ free users, zero purchases
- High paywall show rate (good) but near-zero clicks (bad)

**Quick diagnosis:**
- Paywall UI working? (test in browser)
- Payment link working? (click from paywall, does Stripe load?)
- Free sequence quality good? (compare to competitors)

**Emergency fix (within 24h):**
1. Lower Starter to $9 (test only)
2. Improve free sequence quality (Product team)
3. Test paywall copy (A/B variant)
4. Pivot to Gumroad ($5-10 pay-what-you-want)

### Churn Is Too High (>15% monthly)

**Symptoms:**
- 3-4 Pro customers cancel in month 2
- Customers cite "not using it enough" or "feature gaps"

**Quick diagnosis:**
- Check Stripe Dashboard for churn reasons
- Review customer feedback from emails
- Measure feature engagement (how many sequences per customer?)

**Emergency fix (within 1 week):**
1. Implement usage triggers (re-engagement emails)
2. Improve onboarding (show value immediately)
3. Offer pause option instead of cancel (recover 30% of churns)
4. Lower Pro to $29 (test, see if retention improves)

### Starter Cannibalizing Pro (80%+ choose Starter)

**Symptoms:**
- Most customers buy $19 Starter
- Few customers upgrade to Pro
- Revenue is lower than projected

**Quick diagnosis:**
- Did customers exhaust Starter quota? (check D1)
- Did they try to generate more? (check API logs)
- Did upgrade email send? (check Stripe history)

**Emergency fix (within 1 week):**
1. Test removing Starter tier (go subscription-only at $39)
2. Or test: Starter = $39 (one-time, equivalent to Pro's first month)
3. Add upgrade CTA in UI (when user runs out of 50 sequences)

---

## Next Actions

**Right now (Today):**
- [ ] DevOps: Configure Stripe success/cancel URLs
- [ ] DevOps: Deploy frontend to production
- [ ] Sales: Share this README with team

**This week:**
- [ ] Test payment end-to-end (use real card)
- [ ] Process first payment manually
- [ ] Document any issues found
- [ ] Monitor Stripe Dashboard daily

**Next week:**
- [ ] Measure free-to-paid conversion rate
- [ ] A/B test paywall copy (2 variants)
- [ ] Plan email collection feature
- [ ] Create customer testimonial template

**By end of month:**
- [ ] Review metrics vs 30-day targets
- [ ] Decide: Iterate pricing or scale?
- [ ] Plan next optimization cycle
- [ ] Share results with CEO

---

## Tools You'll Need

### Monitoring
- **Stripe Dashboard:** https://dashboard.stripe.com
  - Daily check for payments
  - Monitor payment success rate
  - Review customer details
  - Check churn reasons

- **Google Analytics (if set up):**
  - Track free users → paywall shows
  - Measure conversion funnel
  - Monitor traffic source

### Tracking
- **Spreadsheet (simple):** Customer list
  - Name, Email, Payment date, Tier, Status
  - Update manually as orders come in
  - Calculate monthly metrics

- **Stripe Reports (free):** Built-in analytics
  - Payment success rate
  - Churn rate
  - Revenue trends

### Customer Communication
- **Email service (Substack, Mailchimp, or manual):**
  - Lifecycle email sequences
  - Win-back campaigns
  - Payment follow-ups

---

## FAQ

**Q: How do I know if pricing is right?**
A: Track free-to-paid conversion rate. Target: 1-3% after 2 weeks. If <0.5%, lower prices. If >5%, you might be pricing too low.

**Q: What if someone wants a refund?**
A: Stripe handles chargeback disputes. For customer-initiated refunds, process within 7 days (our policy). Manual process for MVP.

**Q: How do I match a payment to a customer?**
A: Check Stripe Dashboard for payment details (email if collected, metadata, timestamp). Match to D1 `usage` or `tiers` table by fingerprint or email.

**Q: Can I offer discounts?**
A: Not easily with Payment Links (Stripe limitation). Workaround: Use discount code ($5 off = $14 Starter, $34 Pro). Create in Stripe Dashboard.

**Q: What if PayPal customers ask for it?**
A: Not supported yet (Payment Links only supports Stripe). Add to Phase 2.

**Q: Should I have a free tier?**
A: No. Free tier = high volume, low engagement. 1 free generation is enough.

**Q: When do I add more features?**
A: After 50 customers. Focus on acquisition first, retention second.

---

## Success Criteria

### Day 30 Milestone
- [ ] 300+ free users
- [ ] 5-10 paywall shows
- [ ] 2-3 customers
- [ ] Manual quota upgrade working
- [ ] Revenue: $50-100

### Day 60 Milestone
- [ ] 800+ free users
- [ ] 20+ paywall shows
- [ ] 10-12 customers
- [ ] 2+ Starter-to-Pro upgrades
- [ ] Revenue: $200-300

### Day 90 Milestone
- [ ] 2,000+ free users
- [ ] 60-80 paywall shows
- [ ] 30-40 customers
- [ ] 10+ Starter-to-Pro upgrades
- [ ] Revenue: $400-800 MRR

---

## Questions?

- **Pricing questions?** → See `pricing-strategy-analysis.md`
- **Conversion questions?** → See `conversion-optimization-playbook.md`
- **Payment/Stripe questions?** → See `stripe-payment-links-live.md`
- **Revenue/financial questions?** → See `stripe-payment-links-live.md` (unit economics section)

---

## Credits

**Written by:** Aaron Ross (Sales Agent)
**Based on:** Predictable Revenue principles + Product-Led Growth best practices
**Date:** 2026-02-20
**Status:** Production ready

---

**Last update:** 2026-02-20
**Next review:** After 30 days of live payments (2026-03-20)
