# API — Vercel serverless functions

Each `*.ts` file in this directory becomes one HTTP endpoint, mounted by Vercel's filesystem router at `/api/<path>`. The `[param]` syntax denotes path parameters.

## Routes

| File | Method(s) | Path | Purpose |
|---|---|---|---|
| `health.ts` | GET | `/api/health` | uptime probe + service mode |
| `ai/health.ts` | GET | `/api/ai/health` | reports `SERVICE_MODE` + image providers |
| `status.ts` | GET | `/api/status` | rolling per-service outcome dashboard (powers landing-page status dots) |
| `auth/me.ts` | GET | `/api/auth/me` | verify bearer + return profile |
| `sessions/index.ts` | POST | `/api/sessions` | host creates a session, AI fills meals |
| `sessions/[id].ts` | GET | `/api/sessions/:id` | host view (auth, host-only) |
| `sessions/[id]/regenerate.ts` | POST | `/api/sessions/:id/regenerate` | wipe + regenerate meals |
| `sessions/token/[token].ts` | GET | `/api/sessions/token/:token` | guest view (public) |
| `sessions/mine.ts` | GET | `/api/sessions/mine` | host's own sessions list with voter counts |
| `votes/guest.ts` | POST | `/api/votes/guest` | mint a guest token (`ensure_guest` RPC) |
| `votes/index.ts` | POST | `/api/votes` | cast a vote (`cast_vote` RPC) |
| `saved-meals/index.ts` | GET, POST | `/api/saved-meals` | list / save (auth) |
| `saved-meals/[id].ts` | DELETE | `/api/saved-meals/:id` | remove (auth) |
| `saved-meals/reorder.ts` | PATCH | `/api/saved-meals/reorder` | bulk reorder (auth) |
| `account.ts` | DELETE | `/api/account` | delete own auth user; saved meals are anonymised, not destroyed |
| `track/visit.ts` | POST | `/api/track/visit` | record a landing-page visit |
| `track/login.ts` | POST | `/api/track/login` | record a successful sign-in |
| `_cron/weekly-stats.ts` | GET | `/api/_cron/weekly-stats` | Vercel-Cron-only — emails the weekly digest, then trims `events` / clears `error_log` |

## Conventions

- Every handler is wrapped with `route()` from [`_lib/handler.ts`](_lib/handler.ts), which gates the HTTP method, performs optional bearer auth, applies a 100 KB body cap, and converts `ApiError` instances into the right status code.
- Validation lives in [`../backend/src/utils/validation.util.ts`](../backend/src/utils/validation.util.ts) — never inline validation in a handler.
- Rate limiting goes through [`_lib/ratelimit.ts`](_lib/ratelimit.ts), which calls the Postgres `check_rate` RPC. Limiter fails open on DB errors so a misconfigured DB can't lock real users out — watch the logs.
- Data access goes through `dataService` from [`../backend/src/services/service-factory.ts`](../backend/src/services/service-factory.ts), which switches between real Supabase and the in-memory mock at boot based on `SERVICE_MODE`.
- AI orchestration goes through `aiService` similarly. Don't reach for OpenRouter or image providers directly from handlers.
- Cron handlers under `_cron/` check `Authorization: Bearer ${CRON_SECRET}` against the env var before doing any work; non-matching requests get 401 immediately.

## Local dev

`npm run dev:backend:mock` (or `:test`, `:prod`) starts an Express shim in [`../backend/src/dev-server.ts`](../backend/src/dev-server.ts) that auto-mounts the same handlers, so the URL space matches Vercel exactly. No Vercel CLI needed for development.

The cron endpoint is reachable in dev too — call it manually with the matching `CRON_SECRET` to test the digest locally.
