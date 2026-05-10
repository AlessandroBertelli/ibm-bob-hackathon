# Backend

> Pure TypeScript code library. There is no separate backend package any more — handlers live in [`../api/`](../api/) and the shared root [`../package.json`](../package.json) declares production deps.

This folder holds:

| File | Purpose |
|---|---|
| `src/services/` | LLM (OpenRouter), image generation orchestrator + providers, Supabase admin client, AI orchestration, mock implementations |
| `src/types/` | Shared TypeScript shapes (auth, session, ai, saved-meal) |
| `src/utils/` | Errors + validators |
| `src/dev-server.ts` | **Local dev only.** Tiny Express shim that auto-mounts every Vercel handler in `../api/` so you can develop without `vercel dev`. |
| `src/services/session.flow.ts` | Helper called by both `POST /api/sessions` and `…/regenerate` to build the 4-meal payload (saved + generated). |
| `src/services/imagegen/` | Provider rotation: Pollinations, Hugging Face Inference (FLUX.1-schnell), Cloudflare Workers AI (FLUX-1-schnell). Selected via `IMAGE_PROVIDERS`. |

## Entry points

- **Production** — none. Vercel imports from `api/*.ts`, which import from `services/*`. `dev-server.ts` is never deployed.
- **Local dev** — `dev-server.ts` is the entry, started by `npm run dev:backend:mock` from the repo root.

## Auth

Magic-link emails are sent by **Supabase Auth**, not this backend. Each authenticated handler verifies bearer tokens via `dataService.getUserFromAccessToken`. In mock mode the token format is `Bearer mock:<email>` and any value is accepted.
