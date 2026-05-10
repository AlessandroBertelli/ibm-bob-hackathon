# API — Vercel serverless functions

Each `*.ts` file in this directory becomes one or more HTTP endpoints, mounted by Vercel's filesystem router at `/api/<path>`. We use Optional Catch-All routes (`[[...slug]].ts`) to consolidate multiple paths into a single serverless function to stay within the Vercel Hobby plan limit.

## Consolidated Routes

| File | Method(s) | Base Path | Handles |
|---|---|---|---|
| `sessions/[[...path]].ts` | GET, POST | `/api/sessions` | Create, Host View, Mine, Regenerate, Guest View (token) |
| `saved-meals/[[...path]].ts` | GET, POST, PATCH, DELETE | `/api/saved-meals` | List, Save, Reorder, Delete |
| `track/[[...action]].ts` | POST | `/api/track` | Visit, Login |
| `votes/[[...action]].ts` | POST | `/api/votes` | Cast Vote, Mint Guest Token |
| `system/[[...path]].ts` | GET | `/api/system` | Health, Status, AI Health |
| `auth/[[...path]].ts` | GET, DELETE | `/api/auth` | Me (Profile), Account Deletion |
| `cron/weekly-stats.ts` | GET | `/api/cron/weekly-stats` | Vercel Cron — emails the weekly digest |

**Total: 7 Serverless Functions.**

## Conventions

- Every handler is wrapped with `route()` from [`_lib/handler.ts`](_lib/handler.ts), which gates the HTTP method, performs optional bearer auth, applies a 100 KB body cap, and converts `ApiError` instances into the right status code.
- **Routing:** Catch-all routes use `req.query.path` or `req.query.action` to branch logic based on the sub-path.
- **Auth:** Consolidated handlers manage their own `req.user` checks if only some sub-paths require authentication (e.g., `track/visit` is public, `track/login` is authed).
- **Validation:** Lives in [`../backend/src/utils/validation.util.ts`](../backend/src/utils/validation.util.ts) — never inline validation in a handler.
- **Rate limiting:** Goes through [`_lib/ratelimit.ts`](_lib/ratelimit.ts), which calls the Postgres `check_rate` RPC.
- **Service Access:** All data/AI logic goes through the factory-provided services in `backend/src/services/`.

## Local dev

`npm run dev:backend:mock` (or `:test`, `:prod`) starts an Express shim in [`../backend/src/dev-server.ts`](../backend/src/dev-server.ts) that auto-mounts the same handlers.

**Note:** Ensure your local Express shim is updated to handle the `[[...slug]]` catch-all pattern if adding new consolidated routes.
