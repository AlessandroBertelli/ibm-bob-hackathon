# Pages

Top-level route components. Wired up in [`../App.tsx`](../App.tsx); each is rendered inside the global `AppLayout`.

| Path | File | Role |
|---|---|---|
| `/` | Landing.tsx | Sign-in (magic link). Redirects to `/create` when already authenticated. |
| `/auth/verify` (alias `/verify`) | AuthVerify.tsx | Finalises the magic-link callback (PKCE `?code=` or fragment tokens) and redirects via the `redirect_to` query param. |
| `/create` | CreateSession.tsx | Screen 1 — vibe + headcount + diet flags + My Food picker (max 4). Auth-gated. |
| `/session/:id` | SessionView.tsx | Screen 2 — host review of the 4 generated cards, public-link disclosure, share modal + QR code. |
| `/vote/:token` | VotingInterface.tsx | Screen 3 — anonymous swipe voting. Mints a guest token via the backend and casts votes through the `cast_vote` RPC. |
| `/results/:token` | LiveResults.tsx | Screen 4 — Realtime-sorted ranking, no terminal "winner". Heart button on each row. |
| `/profile/saved-meals` | SavedMeals.tsx | "My Food" management — search, drag to reorder, swipe-left to delete. Auth-gated. |

There is no `/winner/*` route. The terminal "winner" concept was retired — `/results/:token` is the only post-vote screen and never locks.
