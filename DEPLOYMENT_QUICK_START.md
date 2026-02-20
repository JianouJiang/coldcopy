# ColdCopy Deployment Quick Start

**TL;DR:** One command to deploy and verify:

```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy
./deploy-and-verify.sh
```

**Expected time:** 5 minutes
**Success indicator:** "✅ DEPLOYMENT SUCCESSFUL" + live URL

---

## Prerequisites (Check These First)

### 1. Get ANTHROPIC_API_KEY
- Go to https://console.anthropic.com/settings/keys
- Create a new API key (save it!)
- Cost: ~$0.011 per 7-email sequence, free tier has $5 credit

### 2. Set the key in Cloudflare
```bash
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name coldcopy
# Paste your key when prompted
```

Verify it's set:
```bash
npx wrangler pages secret list --project-name coldcopy
# Should show: ANTHROPIC_API_KEY
```

---

## Deploy

**One command:**
```bash
./deploy-and-verify.sh
```

**What it does:**
1. ✅ Checks environment (ANTHROPIC_API_KEY, database, KV)
2. ✅ Builds frontend (npm run build)
3. ✅ Deploys to Cloudflare Pages
4. ✅ Runs 6 smoke tests
5. ✅ Logs everything to `deploy-log-YYYYMMDD-HHMMSS.txt`

**Output:**
```
================================
ColdCopy Deploy & Verify
================================

[...lots of useful progress...]

================================
✅ DEPLOYMENT SUCCESSFUL
================================

Production URL: https://1b41a14c.coldcopy-au3.pages.dev

All checks passed:
  ✅ Environment configured correctly
  ✅ Frontend built and deployed
  ✅ Cloudflare Pages deployment successful
  ✅ Smoke tests passed

ColdCopy is now live and ready to generate cold email sequences.
```

---

## Test It Works

Visit the production URL in your browser:
https://1b41a14c.coldcopy-au3.pages.dev

1. Go to the `/generate` page (button on landing)
2. Fill out the form:
   - Company Name: "TestCorp"
   - Target Job Title: "VP of Engineering"
   - Problem: "Losing revenue to downtime"
   - Product: "Infrastructure monitoring"
   - Benefit: "99% uptime guaranteed"
   - CTA: "Book a demo"
3. Click "Generate Sequence"
4. You should see 7 cold emails generated in ~3-5 seconds
5. Each email has 2 A/B subject lines + body

---

## If Something Goes Wrong

### Deployment failed? Check the log:
```bash
cat deploy-log-*.txt | tail -50
```

### Specific issues:

**"ANTHROPIC_API_KEY is not defined"**
```bash
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name coldcopy
# Paste your key, then re-run:
./deploy-and-verify.sh
```

**"Database not found"**
```bash
# Create database
npx wrangler d1 create coldcopy-db
# Update wrangler.toml with the returned database_id, then:
./deploy-and-verify.sh
```

**"Frontend returns 404"**
```bash
# Rebuild
npm run build
# Redeploy
./deploy.sh
```

**Need help?** See `/docs/devops/deployment-automation.md` (comprehensive troubleshooting guide)

---

## Rollback (if needed)

If deployment breaks, one command reverts:
```bash
# Rollback to previous version
git revert HEAD && git push origin main
# Or use Cloudflare Dashboard: Pages → coldcopy → Deployments → Rollback
```

---

## Files

| File | Purpose | When to use |
|------|---------|------------|
| `deploy-and-verify.sh` | Full deployment pipeline | Every production deployment |
| `check-env.sh` | Environment validation only | Debugging setup issues |
| `deploy.sh` | Build & deploy only | If you trust environment |
| `smoke-test.sh` | Test live deployment | Verify deployment works |
| `/docs/devops/deployment-automation.md` | Complete reference | Troubleshooting & details |

---

## Monitoring After Deploy

**Check logs:**
```bash
wrangler tail --format pretty
```

**Check database:**
```bash
npx wrangler d1 execute coldcopy-db --command "SELECT COUNT(*) as sessions FROM sessions"
```

**Check Cloudflare Pages:**
- Dashboard: https://dash.cloudflare.com
- Pages → coldcopy → Deployments
- Should show green checkmark for latest deployment

---

## Cost

- **Per deployment:** Free (Cloudflare Pages build is included)
- **Per generation:** ~$0.011 (Claude Haiku API cost)
- **Per 100 generations/month:** ~$1.10 (costs will be billed to Anthropic account)
- **Infrastructure:** Free tier covers everything

---

## Support

**Questions?**
- See `/docs/devops/deployment-automation.md` (Comprehensive guide)
- See `/projects/coldcopy/BACKEND_SETUP.md` (Technical setup)
- See `/projects/coldcopy/ANTHROPIC_API_KEY_SETUP.md` (API key guide)

**Emergency?**
- Rollback: `git revert HEAD && git push origin main`
- Check logs: `wrangler tail --format pretty`
- Force redeploy: `./deploy-and-verify.sh`

---

**Version:** 1.0
**Status:** Ready for production
**Last Updated:** 2026-02-20
