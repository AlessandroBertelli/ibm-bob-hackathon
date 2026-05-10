# Hooks

Custom React hooks.

| File | Purpose |
|---|---|
| useAuth.ts | Wraps Supabase Auth (or mock-mode token). Exposes `user`, `signInWithEmail(email, redirectTo?)`, `signInMock(email)`, `signOut()`. |
| useSavedMeals.ts | Loads "My Food" with optimistic save / reorder / remove. Pass `enabled=false` to skip the initial fetch when unauthenticated. |
| useMySessions.ts | Loads the host's own session list (with voter counts) via `GET /api/sessions/mine`. Powers the profile-page history block + the conditional "My Food" pill on `/create`. |
| useRealtimeSession.ts | Subscribes to Supabase Realtime updates for one session and keeps `meals` sorted by likes for the live-results screen. Falls back to polling in mock mode. |
| useGuestSession.ts | Mints (or reuses from `localStorage`) a `guest_token` so anonymous voters can call the `cast_vote` RPC. |
| useSwipe.ts | Card-stack swipe gesture state + handlers, used by `VotingInterface`. |

Conventions: camelCase with `use` prefix, named exports, return shape typed explicitly.
