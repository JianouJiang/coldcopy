# ColdCopy

AI-powered cold email sequence generator for B2B SaaS founders.

## What is ColdCopy?

ColdCopy generates SaaS-specific cold email sequences that book meetings, not spam folders. Unlike generic AI tools, ColdCopy understands trial CTAs, demo hooks, and technical credibility builders.

## Features

- 5-email sequences with A/B subject line variants
- SaaS-specific language (trials, demos, integrations)
- Copy-paste ready for Lemlist, Instantly, Apollo
- 2-minute input form to usable sequences
- Free first sequence, then $29 one-time or $49/month

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Cloudflare Workers + D1 + KV
- **AI:** Claude API (Haiku 4.5)
- **Payment:** Stripe Payment Links

## Development

```bash
cd frontend
npm install
npm run dev
```

## Architecture

See `docs/cto/coldcopy-adr-001.md` for full technical architecture.

## License

Proprietary. All rights reserved.
