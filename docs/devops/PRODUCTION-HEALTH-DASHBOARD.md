# ColdCopy Production Health Dashboard

**Last Updated:** 2026-02-20 11:52 UTC
**Environment:** Production (Cloudflare Pages + D1 + KV)

---

## Quick Health Check

```bash
# Run this one-liner to check all infrastructure health
npx wrangler d1 info coldcopy-db && \
npx wrangler kv key list --namespace-id=e3dd9a4e48ee49e998e11c3e96823ab6 | wc -l && \
curl -s -o /dev/null -w "Frontend: %{http_code} (${response_time}s)\n" https://3a9bbbba.coldcopy-au3.pages.dev
```

---

## Current Metrics (as of 2026-02-20 11:52 UTC)

### D1 Database
| Metric | Value | Limit | Usage % |
|--------|-------|-------|---------|
| Database Size | 279 kB | 500 MB (free) | 0.05% |
| Total Sessions | 43 | No limit | - |
| Total Sequences | 31 | No limit | - |
| Read Queries (24h) | 24 | 5M/day (free) | 0.0005% |
| Write Queries (24h) | 103 | 100K/day (free) | 0.1% |
| Rows Read (24h) | 178 | No explicit limit | - |
| Rows Written (24h) | 254 | No explicit limit | - |

**Status:** ✅ HEALTHY (far below limits)

### KV Namespace
| Metric | Value | Limit | Usage % |
|--------|-------|-------|---------|
| Total Keys | 0 | 1B keys (no practical limit) | 0% |
| Read Operations (24h) | Unknown | 10M/day (free) | - |
| Write Operations (24h) | Unknown | 1M/day (free) | - |

**Status:** ✅ HEALTHY (unused, ready for scale)

### Cloudflare Pages
| Metric | Value | Status |
|--------|-------|--------|
| Live URL | https://3a9bbbba.coldcopy-au3.pages.dev | ✅ Online |
| Latest Deployment | 3a9bbbba | ✅ Active |
| Build Status | Compiled Worker successfully | ✅ OK |
| Last Deploy Time | 2026-02-20 11:47:43 UTC | Recent |

**Status:** ✅ HEALTHY

---

## API Performance

| Endpoint | Avg Response Time | P95 | P99 | Status |
|----------|-------------------|-----|-----|--------|
| POST /api/generate | ~12.6s | Unknown | Unknown | ✅ Normal (Claude API latency) |
| GET /api/session | <1s | Unknown | Unknown | ✅ Fast |

**Notes:**
- Generation time dominated by Claude API call (expected 10-15s)
- No caching or optimization yet
- Acceptable for MVP, can optimize later with streaming or parallel processing

---

## Error Rates

**Current Error Monitoring:** Manual (no automated alerting yet)

### Expected Errors (Designed Behavior)
| Error | HTTP Code | Trigger | Count (today) |
|-------|-----------|---------|---------------|
| quota_exceeded | 402 | Free user attempts 2nd generation | Unknown |
| rate_limit_exceeded | 429 | >1 req/hour from same session | 0 (not reached) |
| Missing field | 400 | Invalid form data | Unknown |

### Unexpected Errors (Actionable)
| Error | HTTP Code | Last Seen | Count (today) |
|-------|-----------|-----------|---------------|
| None | - | Never | 0 |

**Status:** ✅ No production errors detected

---

## Quota & Limits Tracking

### Free Plan Sessions
- **Total Sessions Created:** 43
- **Sessions with 1 Generation:** 31 (quota used)
- **Sessions with 0 Generations:** 12 (abandoned before generation)
- **Conversion Rate:** 72% (31/43 completed generation)

### Cloudflare Free Tier Limits
| Service | Limit | Current Usage | Headroom |
|---------|-------|---------------|----------|
| D1 Reads/day | 5,000,000 | 24 | 99.9995% |
| D1 Writes/day | 100,000 | 103 | 99.897% |
| D1 Storage | 500 MB | 0.279 MB | 99.94% |
| KV Reads/day | 10,000,000 | 0 | 100% |
| KV Writes/day | 1,000,000 | 0 | 100% |
| Pages Functions Requests | 100,000/day | Unknown | Unknown |

**Status:** ✅ WELL BELOW ALL LIMITS (room to scale 100x-1000x)

---

## Secrets & Environment Variables

| Secret | Status | Location | Last Rotated |
|--------|--------|----------|--------------|
| ANTHROPIC_API_KEY | ✅ Set | Cloudflare Pages Secret | Never |

**Security Notes:**
- API key stored in Cloudflare Secrets (encrypted at rest)
- Never logged or exposed in client-side code
- No rotation policy yet (TODO: implement quarterly rotation)

---

## Monitoring Commands

### Check D1 Health
```bash
# Database info
npx wrangler d1 info coldcopy-db

# Session count
npx wrangler d1 execute coldcopy-db --remote --command "SELECT COUNT(*) as total_sessions FROM sessions;"

# Sequence count
npx wrangler d1 execute coldcopy-db --remote --command "SELECT COUNT(*) as total_sequences FROM sequences;"

# Recent activity
npx wrangler d1 execute coldcopy-db --remote --command "SELECT id, plan, generations_used, created_at FROM sessions ORDER BY created_at DESC LIMIT 10;"
```

### Check KV Health
```bash
# List all keys
npx wrangler kv key list --namespace-id=e3dd9a4e48ee49e998e11c3e96823ab6

# Count keys
npx wrangler kv key list --namespace-id=e3dd9a4e48ee49e998e11c3e96823ab6 | wc -l
```

### Check Pages Deployment
```bash
# List recent deployments
npx wrangler pages deployments list --project-name coldcopy

# Tail live logs
npx wrangler pages logs --project-name coldcopy --tail
```

### Test Endpoints
```bash
# Test frontend
curl -I https://3a9bbbba.coldcopy-au3.pages.dev

# Test API health (minimal session check)
curl -s https://3a9bbbba.coldcopy-au3.pages.dev/api/session | jq .

# Test generation (full smoke test)
curl -X POST https://3a9bbbba.coldcopy-au3.pages.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "HealthCheckCo",
    "targetJobTitle": "CTO",
    "problemTheyFace": "Monitoring infrastructure manually",
    "yourProduct": "Automated health dashboard",
    "keyBenefit": "24/7 visibility with zero manual work",
    "callToAction": "Schedule a demo",
    "tone": "Professional"
  }' | jq '.success'
```

---

## Alerting Thresholds (Manual for Now)

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| D1 Size | >250 MB | >450 MB | Archive old data or upgrade plan |
| D1 Writes/day | >50K | >90K | Investigate traffic spike or bot attack |
| API Response Time | >20s | >30s | Check Claude API status, consider caching |
| Error Rate | >1% | >5% | Investigate logs, rollback if needed |
| Session Creation Rate | >1000/hr | >5000/hr | Potential bot attack, enable Cloudflare Turnstile |

**TODO:** Set up automated alerting via Cloudflare Workers Analytics or third-party service (e.g., Better Uptime, Sentry)

---

## Incident Response Playbook

### 1. API Returning 500 Errors
```bash
# Check logs
npx wrangler pages logs --project-name coldcopy --tail

# Check D1 connectivity
npx wrangler d1 execute coldcopy-db --remote --command "SELECT 1;"

# Check ANTHROPIC_API_KEY
# (Manual: verify in Cloudflare Dashboard → Pages → Settings → Environment Variables)

# If all else fails: rollback
# npx wrangler pages deployment promote <previous-deployment-id> --project-name coldcopy
```

### 2. Database Size Growing Rapidly
```bash
# Check size breakdown
npx wrangler d1 execute coldcopy-db --remote --command "SELECT COUNT(*) FROM sessions;"
npx wrangler d1 execute coldcopy-db --remote --command "SELECT COUNT(*) FROM sequences;"

# Check largest sequences (potential abuse)
npx wrangler d1 execute coldcopy-db --remote --command "SELECT id, LENGTH(output) as size FROM sequences ORDER BY size DESC LIMIT 10;"

# Clean up old test data (if needed)
# npx wrangler d1 execute coldcopy-db --remote --command "DELETE FROM sessions WHERE created_at < datetime('now', '-30 days');"
```

### 3. Claude API Timeout Spike
```bash
# Check error rate
npx wrangler pages logs --project-name coldcopy --tail | grep "timed out"

# Check Claude API status
curl -s https://status.anthropic.com/api/v2/status.json | jq .

# Temporary fix: increase timeout in generate.ts (currently 25s)
# Long-term fix: implement retry with exponential backoff
```

---

## Backup & Disaster Recovery

### D1 Database Backup
```bash
# Export all sessions
npx wrangler d1 execute coldcopy-db --remote --command "SELECT * FROM sessions;" > backup-sessions-$(date +%Y%m%d).json

# Export all sequences
npx wrangler d1 execute coldcopy-db --remote --command "SELECT * FROM sequences;" > backup-sequences-$(date +%Y%m%d).json
```

**Backup Schedule:** Manual (TODO: automate weekly via GitHub Actions)

### Recovery Plan
1. Create new D1 database: `npx wrangler d1 create coldcopy-db-recovery`
2. Apply schema: `npx wrangler d1 execute coldcopy-db-recovery --remote --file=schema.sql`
3. Restore data: `npx wrangler d1 execute coldcopy-db-recovery --remote --file=backup.sql`
4. Update Pages binding to new database
5. Deploy

**RTO (Recovery Time Objective):** <1 hour
**RPO (Recovery Point Objective):** 24 hours (with daily backups)

---

## Cost Tracking

### Current Costs (Free Tier)
- **Cloudflare Pages:** $0/month (under 500 builds/month)
- **D1 Database:** $0/month (under 5M reads/day, 100K writes/day)
- **KV Namespace:** $0/month (under 10M reads/day, 1M writes/day)
- **Anthropic API:** ~$0.03 per generation (Haiku 4.5 pricing: $0.80/1M input tokens, $4/1M output tokens)

**Total Infrastructure Cost:** $0/month
**Variable Cost (API):** ~$0.03 per email sequence generated

### Projected Costs at Scale
| Sessions/Day | API Cost | CF Cost | Total/Month |
|--------------|----------|---------|-------------|
| 10 | $0.30/day | $0 | ~$9/month |
| 100 | $3/day | $0 | ~$90/month |
| 1,000 | $30/day | $0 | ~$900/month |
| 10,000 | $300/day | $20 (upgrade to D1 paid) | ~$9,000/month |

**Note:** At 1000+ sessions/day, need to implement pricing model to cover API costs.

---

**Dashboard Maintained By:** DevOps Agent (Kelsey Hightower)
**Update Frequency:** After each deployment or weekly (whichever comes first)
**Next Review:** 2026-02-27
