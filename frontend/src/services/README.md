# Services

API service modules. Thin wrappers around the atavola backend (`/api/...`).

| File | Purpose |
|---|---|
| api.ts | Shared Axios instance. Pulls the bearer token from the active Supabase session (or the mock-mode token in `localStorage`) at request time. |
| session.service.ts | `createSession`, `getSession`, `getSessionByToken`, `regenerateSession`, `listMySessions`. |
| vote.service.ts | `mintGuest(sessionId)` and `castVote(token, mealId, value)`. |
| savedMeals.service.ts | "My Food" CRUD: list, create, reorder (bulk), delete. |
| status.service.ts | `getServiceStatus()` — feeds the landing-page status dots from `/api/status`. |
| account.service.ts | `deleteAccount()` — calls `DELETE /api/account` and signs out locally. |
| track.service.ts | `recordVisit()`, `recordLogin()` — fire-and-forget tracking calls. Failures are swallowed so tracking can never break the UX. |

Auth flow lives outside this folder — see [`../lib/supabase.ts`](../lib/supabase.ts) for the browser Supabase client and [`../hooks/useAuth.ts`](../hooks/useAuth.ts) for the higher-level hook. Realtime subscriptions are set up directly in [`../hooks/useRealtimeSession.ts`](../hooks/useRealtimeSession.ts) — no service wrapper needed.
