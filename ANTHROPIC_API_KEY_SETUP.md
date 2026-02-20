# ANTHROPIC_API_KEY Setup Guide

## What This Is

ColdCopy uses **Claude Haiku 4.5** (`claude-haiku-4-5-20250101`) to generate cold email sequences. This requires an Anthropic API key.

## Cost

- **Claude Haiku 4.5**: ~$0.011 per 7-email sequence
- **Expected usage**: 100 generations/month = $1.10/month
- **Anthropic free tier**: $5 credit (covers ~450 generations)

## How to Get the API Key

1. **Create an Anthropic account**: https://console.anthropic.com/
2. **Navigate to API Keys**: https://console.anthropic.com/settings/keys
3. **Create a new key**: Click "Create Key", copy the key (starts with `sk-ant-api03-...`)
4. **⚠️ CRITICAL**: This key will only be shown once. Save it immediately.

## How to Configure It

### For Local Development (`wrangler pages dev`)

1. Create `.dev.vars` file in project root:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Edit `.dev.vars` and paste your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
   ```

3. **Verify** `.dev.vars` is in `.gitignore` (it should be by default)

### For Production (Cloudflare Pages)

Run this command **once** to store the key in Cloudflare's secret store:

```bash
npx wrangler pages secret put ANTHROPIC_API_KEY --project-name coldcopy
```

When prompted, paste your API key and press Enter.

**Verification**:
```bash
npx wrangler pages secret list --project-name coldcopy
```

Should output:
```
ANTHROPIC_API_KEY
```

## Security Checklist

- [ ] `.dev.vars` is in `.gitignore` ✅ (already done)
- [ ] Never commit the API key to git
- [ ] Never log the API key in console or error messages
- [ ] Production key is stored in Cloudflare Secrets (encrypted at rest)
- [ ] Local `.dev.vars` file has restricted permissions (`chmod 600 .dev.vars` recommended)

## Monitoring Usage

Check your Anthropic usage dashboard: https://console.anthropic.com/settings/usage

## Troubleshooting

### Error: "ANTHROPIC_API_KEY is not defined"

**Local dev**:
- Check if `.dev.vars` exists
- Restart `wrangler pages dev` after creating `.dev.vars`

**Production**:
- Run `npx wrangler pages secret list --project-name coldcopy`
- If empty, re-run `npx wrangler pages secret put`

### Error: "401 Unauthorized"

- Your API key is invalid or expired
- Create a new key at https://console.anthropic.com/settings/keys
- Update both `.dev.vars` (local) and Cloudflare secret (production)

### Error: "429 Too Many Requests"

- You've hit Anthropic's rate limit (5 requests/second for Haiku)
- Our code already has retry logic, but sustained 429s mean high traffic
- Upgrade your Anthropic plan if needed: https://console.anthropic.com/settings/plans

## Next Steps

After setting up the key:

1. **Local test**:
   ```bash
   npm run dev
   # Open http://localhost:8788, fill form, click "Generate Cold Sequence"
   ```

2. **Production deploy**:
   ```bash
   npm run deploy
   # Test on https://coldcopy-au3.pages.dev
   ```

3. **Verify** in Cloudflare Pages dashboard that the secret is bound to the worker

---

**Status**: ⚠️ **ACTION REQUIRED** — Founder must provide ANTHROPIC_API_KEY before MVP can go live.
