# atavola

> Group meal planning via Tinder-style swiping. Hosts pick a vibe, AI generates four meal ideas, the group votes on a public link, results re-sort live.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## What it is

- **Host flow** — sign in via magic link, set a vibe + headcount + diet flags, optionally pre-select up to 4 meals from "My Food", review the AI-generated cards and share a public voting link (native share sheet, copy link, or QR).
- **Guest flow** — open the link, swipe through the 4 cards (right = like, left = dislike), watch the live results re-rank in real time. Heart any card to save it to a personal profile (sign-in prompt if anonymous).
- **No winner state** — the results screen never locks. Anyone with the link keeps voting; the ranking just keeps updating.

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind v4, Framer Motion, dnd-kit, Supabase JS |
| Backend (Vercel serverless) | TypeScript handlers in `api/`, services in `backend/src/` |
| Auth + DB + Realtime + Storage | Supabase (Postgres + Auth + Realtime + Storage) |
| LLM | OpenRouter, free models with automatic rotation |
| Image gen | Rotation across Pollinations.ai → Hugging Face FLUX.1-schnell → Cloudflare Workers AI |
| Email | Resend — magic links via Supabase Auth SMTP, weekly digest via the Resend HTTP API |
| Cron | Vercel Cron (`/api/cron/weekly-stats`) + pgcron (daily session expiry) |
| Hosting | Single Vercel project (frontend + serverless API at the same origin) |

No Render, no Express in production, no separate API host.

---

## Project layout

```
.
├── api/                   Vercel serverless functions, deployed at /api/*
│   ├── _lib/handler.ts    Shared error / auth / method-gating wrapper
│   └── ...                One file per route (Vercel filesystem routing)
├── backend/
│   └── src/
│       ├── services/      LLM, image-gen, Supabase, mock implementations
│       ├── types/
│       ├── utils/
│       └── dev-server.ts  Local-only Express shim that mounts api/ handlers
├── frontend/              React app (Vite)
│   └── public/            Static assets + marketing pages — about.html,
│                          privacy.html, terms.html (served at clean URLs),
│                          plus robots.txt / sitemap.xml / llms.txt /
│                          humans.txt / og.svg / .well-known/security.txt
├── supabase/
│   └── migrations/        SQL schema, RLS, RPCs, Realtime publication
├── .env.example           Single source of truth for env-var names
├── package.json           Root deps for API functions + dev orchestration
├── tsconfig.json          Covers api/ + backend/src/
├── vercel.json            Build + functions config
├── README.md              ← you are here
├── DEPLOYMENT_GUIDE.md    Step-by-step Vercel + Supabase deploy
├── DEPLOYMENT_CONFIG.md   Env-var tracker (no secrets committed)
└── SECURITY.md            Threat model + defenses + operator responsibilities
```

The `frontend/` and `backend/` folders stay split for clarity. They share one Vercel deployment.

---

## Quick start

```bash
npm run install:all
npm run dev:mock            # in-memory data, no keys needed, no real email
```

Frontend at http://localhost:5173, API at http://localhost:3000/api. Sign in with any email — the mock backend trusts whatever you type.

For real services, copy `.env.example` to `.env`, fill in Supabase + OpenRouter (and optionally HF + Cloudflare for image fallbacks), then `npm run dev:prod`.

---

## Service modes

The backend reads `SERVICE_MODE`:

- `mock` — no external services, in-memory data, deterministic placeholder images. The frontend's Supabase client is stubbed when its env vars are absent, so no network calls leak. Auth is by `Authorization: Bearer mock:<email>`.
- `test` — real Supabase + OpenRouter + image providers, intended for staging.
- `production` — full prod behaviour.

Magic-link emails are always sent by Supabase Auth (configured to use Resend SMTP). The backend only verifies bearer tokens for protected routes; it never issues them.

---

## Supabase one-time setup

1. Create a Supabase project, copy the URL, anon key, and service-role key into `.env`.
2. Run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) in the SQL editor (or `supabase db push` with the CLI linked). One file, end-to-end: tables, RLS, RPCs, Realtime publication, Storage bucket, pgcron cleanup job.
3. **Authentication → URL Configuration**: set Site URL to your frontend origin and add `${SITE_URL}/auth/verify` to the redirect allow-list.
4. **Authentication → Email Templates**: review the magic-link copy.
5. **Authentication → SMTP Settings**: plug in Resend (or any SMTP provider).

The migration creates the `meal-images` Storage bucket (public-read, service-role-write) so generated images survive even if a provider rotates its cache.

---

## Image generation rotation

`IMAGE_PROVIDERS` is a comma-separated, ordered list. The orchestrator tries each in sequence and falls through on any failure. All three options are free.

| Provider | Slug | Setup |
|---|---|---|
| Pollinations.ai | `pollinations` | No key. Just works. |
| Hugging Face Inference (FLUX.1-schnell) | `huggingface` | Free token from huggingface.co/settings/tokens → `HUGGINGFACE_API_TOKEN`. |
| Cloudflare Workers AI (FLUX-1-schnell) | `cloudflare` | Free CF account → `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` (Workers AI permission only). ~3,300 images/day on free tier. |

Bytes from whichever provider succeeds are uploaded to Supabase Storage so the URL we hand back never depends on the provider's cache.

---

## OpenRouter model rotation

The backend tries the models listed in `OPENROUTER_MODELS` in order. On rate-limit / 5xx / timeout / empty response it rotates; on a non-retryable 4xx it stops. If every model fails it returns 503. Free model slugs change often — keep the list fresh from https://openrouter.ai/models?max_price=0.

---

## API surface

```
GET    /api/system/health                  uptime probe
GET    /api/system/ai/health               reports SERVICE_MODE + image providers
GET    /api/system/status                  per-service rolling outcome snapshot
GET    /api/auth/me                        verify bearer + return profile

GET    /api/sessions/:id                   host view
GET    /api/sessions/token/:token          guest view (public)
GET    /api/sessions/mine                  host's own sessions list (auth)
POST   /api/sessions                       create + run AI synchronously
POST   /api/sessions/:id/regenerate        wipe meals + re-run AI

POST   /api/votes/guest                    mint a guest_token
POST   /api/votes                          cast a vote (uses cast_vote RPC)

GET    /api/saved-meals                    list "My Food" (auth)
POST   /api/saved-meals                    save (auth)
PATCH  /api/saved-meals/reorder            bulk reorder (auth)
DELETE /api/saved-meals/:id                remove (auth)

DELETE /api/auth/account                   delete own account (auth)

POST   /api/track/visit                    record a landing-page visit
POST   /api/track/login                    record a successful sign-in

GET    /api/cron/weekly-stats             Vercel Cron — weekly digest email
```

Realtime is **not** an HTTP endpoint — the frontend subscribes directly to Supabase channels for `session_meals` and `votes`.

## Operations & observability

- **Service status** — every external call (Supabase RPC, OpenRouter, each image provider, Resend) upserts its last outcome into `service_status` via the `record_service_outcome` RPC. The landing page polls `/api/system/status` and renders coloured dots so the operator sees provider drift at a glance.
- **Lightweight tracking** — `events` (last 30 days), `aggregated_stats` (lifetime totals), `error_log` (rolling) feed a Monday weekly email digest sent from `/api/cron/weekly-stats`. The cron is wired in [`vercel.json`](vercel.json) and authenticated with `CRON_SECRET`.
- **Daily auto-purge** — pgcron job `atavola-cleanup-expired-sessions` runs at 03:15 UTC and drops sessions older than 30 days; saved meals survive (FK is `ON DELETE SET NULL` so anonymised recipes stay searchable).

---

## Scripts

```bash
npm run install:all          install root + frontend
npm run dev:mock             both servers, mock mode (default)
npm run dev:test             both servers, real services (staging)
npm run dev:prod             both servers, production mode
npm run dev:backend          backend only (dev-server)
npm run dev:frontend         frontend only
npm run typecheck            tsc --noEmit on api/+backend/src and on frontend
npm run lint                 ESLint on the frontend
npm run build                build the Vite app for production
```

Shipping to Vercel runs `npm install` at the repo root + `npm install` in `frontend/` + `npm run build`. Vercel auto-mounts `api/*` as serverless functions. No extra config.

---

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the step-by-step Vercel + Supabase walkthrough, [DEPLOYMENT_CONFIG.md](DEPLOYMENT_CONFIG.md) for the env-var matrix, and [SECURITY.md](SECURITY.md) for the threat model + the rotations you owe before going live.

---

## License

MIT — see [LICENSE](LICENSE).

<!-- Made with Bob -->
