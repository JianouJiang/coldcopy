# ColdCopy Backend Setup Guide

Quick reference for setting up and running the ColdCopy backend locally and in production.

## Local Development

### Prerequisites
- Node.js 18+
- `wrangler` CLI installed globally: `npm install -g wrangler`
- `uv` or `python` 3.9+ (for dependencies)

### Environment Setup

1. **Create `.dev.vars` file** (in project root, never commit):
```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
```

Get your API key from [Anthropic Console](https://console.anthropic.com/account/keys).

2. **Start local dev server** (two terminals):

Terminal 1 - Frontend dev server:
```bash
cd frontend
npm install  # if first time
npm run dev
# → http://localhost:5173
```

Terminal 2 - Backend dev server:
```bash
cd projects/coldcopy  # if not already there
npx wrangler pages dev frontend/dist
# → http://localhost:8788
```

The Vite proxy in `vite.config.ts` routes `/api/*` requests to the backend server automatically.

### Testing Locally

1. Navigate to http://localhost:5173
2. Go to `/generate` page
3. Fill out the form (all 7 fields required)
4. Click "Generate Sequence"
5. Watch the 12-second progress bar
6. When done, you'll see the Output page with generated emails

**Rate Limit Behavior:**
- First submission: succeeds, sets `coldcopy_session` cookie
- Second submission: returns 402 Payment Required (rate limited to 1 per session)
- Clear browser cookies to reset

## Production Setup (Day 5)

### Step 1: Create D1 Database

```bash
npx wrangler d1 create coldcopy-db
```

This returns a `database_id`. Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "coldcopy-db"
database_id = "your-id-here"  # <-- paste the ID
```

### Step 2: Create KV Namespace

```bash
npx wrangler kv namespace create RATE_LIMIT
```

This returns a namespace ID. Update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-id-here"  # <-- paste the ID
```

### Step 3: Run Database Schema

```bash
npx wrangler d1 execute coldcopy-db --file schema.sql
```

This creates the `sessions` and `sequences` tables.

### Step 4: Set Secrets

```bash
# Claude API key (required for /api/generate)
npx wrangler secret put ANTHROPIC_API_KEY
# Paste: sk-ant-...

# Stripe secrets (required for payment integration, Day 5)
npx wrangler secret put STRIPE_SECRET_KEY
# Paste your Stripe Secret Key

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your webhook signing secret (generated after Payment Links setup)
```

### Step 5: Verify Configuration

```bash
npx wrangler deployments list
```

Should show your Pages project deployments.

### Step 6: Deploy

```bash
git push origin main
```

GitHub automatically triggers Cloudflare Pages deployment.

**Monitor deployment:**
- Cloudflare Dashboard → Pages → coldcopy
- Check "Deployments" tab for build status

## API Endpoints

### `POST /api/generate`
Generates a cold email sequence.

**Request:**
```json
{
  "companyName": "Acme Analytics",
  "targetJobTitle": "VP of Marketing",
  "problemTheyFace": "They lose 30-40% of revenue to cart abandonment",
  "yourProduct": "Real-time analytics dashboard for e-commerce",
  "keyBenefit": "Identify why carts abandon in 10 seconds",
  "callToAction": "Book a 15-min demo",
  "tone": "Professional"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "sequenceId": "seq-xyz-123",
  "sequence": {
    "emails": [
      {
        "subjectLineA": "...",
        "subjectLineB": "...",
        "body": "..."
      }
      // ... 7 total emails
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required field
- `402 Payment Required` - Rate limit exceeded
- `504 Gateway Timeout` - Claude API request timed out
- `500 Internal Server Error` - Validation failure or unexpected error

### `GET /api/session`
Returns current session information.

**Response:**
```json
{
  "plan": "free",
  "generationsUsed": 0,
  "maxGenerations": 1,
  "canGenerate": true
}
```

## File Structure

```
projects/coldcopy/
├── functions/
│   └── api/
│       ├── generate.ts      # POST /api/generate handler
│       └── session.ts       # GET /api/session handler
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Generate.tsx  # Form with API integration
│   │   │   └── Output.tsx    # Display generated emails
│   │   ├── components/
│   │   │   └── Toast.tsx     # Toast notifications
│   │   ├── hooks/
│   │   │   └── use-toast.ts  # Toast hook
│   │   └── index.css         # Includes @keyframes progressBar
│   ├── vite.config.ts        # API proxy config
│   └── package.json
├── schema.sql                # D1 database schema
├── wrangler.toml            # Cloudflare config
└── README.md
```

## Database Schema

### `sessions` table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,           -- UUID
  plan TEXT DEFAULT 'free',      -- 'free' or 'pro'
  generations_used INTEGER,      -- Number of generations used
  max_generations INTEGER,       -- Monthly limit
  created_at TEXT,              -- ISO datetime
  updated_at TEXT               -- ISO datetime
);
```

### `sequences` table
```sql
CREATE TABLE sequences (
  id TEXT PRIMARY KEY,           -- UUID
  session_id TEXT,              -- Foreign key to sessions
  input JSON,                   -- Original form data
  output JSON,                  -- Generated emails
  created_at TEXT               -- ISO datetime
);
```

## Monitoring & Debugging

### Local Debugging
- Browser DevTools: Network tab (check `/api/generate` request/response)
- Wrangler logs: Check terminal where `wrangler pages dev` is running
- Frontend logs: `console.log()` in React components

### Production Debugging
```bash
# Check recent logs
npx wrangler tail --format pretty

# Check D1 database
npx wrangler d1 execute coldcopy-db --command "SELECT COUNT(*) FROM sessions"

# Check KV usage
npx wrangler kv:key list --namespace-id <RATE_LIMIT_ID>
```

### Common Issues

**"ANTHROPIC_API_KEY is not set"**
- Solution: Run `npx wrangler secret put ANTHROPIC_API_KEY`

**"Database not found"**
- Solution: Verify `database_id` in `wrangler.toml` matches output from `wrangler d1 create`

**"CORS error in browser"**
- Local: Should be handled by Vite proxy. Check that wrangler dev server is running.
- Production: Not an issue (same origin)

**Rate limit always returns 402**
- Expected behavior: Free tier allows 1 generation per session. Clear cookies to reset.

## Performance Targets

- Form submission → Sequence generation: **3-5 seconds** (Claude Haiku latency)
- Cold start overhead: **0-2 seconds** (first request)
- D1 query latency: **50-150ms** from edge
- KV lookup latency: **<50ms**
- Total end-to-end: **3.2-7.2 seconds** typical

## Cost Estimate

At 100 users/day generating sequences:
- Claude Haiku: 100 × $0.011 = **$1.10/day** = $33/month
- D1 storage: ~15 MB/month = **$0** (free tier)
- KV requests: ~100 writes/day = **$0** (free tier, 1K writes/day budget)
- **Total: <$35/month** for MVP scale

## Next Steps

**Day 4:**
- Test Output page display
- Polish loading animation
- Test error paths

**Day 5:**
- Create D1 database in production
- Create KV namespace in production
- Set all secrets
- Deploy via git push
- Test end-to-end in production

**Day 6:**
- QA testing (all flows, edge cases)
- Load testing (100 concurrent requests)
- Session persistence testing
- Rate limit verification

---

See `/docs/fullstack/coldcopy-backend-implementation.md` for detailed architecture documentation.
