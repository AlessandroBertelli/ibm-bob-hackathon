# atavola — Frontend

React 19 + TypeScript + Vite. Built and served by the same Vercel project that hosts the API.

> Project-level docs live in the root [README](../README.md) and [DEPLOYMENT_GUIDE](../DEPLOYMENT_GUIDE.md).

## Run locally

```bash
npm install                  # from frontend/, or `npm run install:all` from the root
npm run dev                  # frontend only at :5173
```

For the full app (frontend + API), use the root scripts: `npm run dev:mock` etc.

In mock mode, sign-in works with any email — no real magic link is sent. The Supabase client is stubbed when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, so no network request is made.

## Env vars

See [`../.env.example`](../.env.example). Only the `VITE_*` variables are read by Vite. The Supabase anon key is safe to expose; RLS protects the data. `VITE_API_URL` defaults to `/api` (same origin) and only needs setting if you ever split frontend and API across origins.

## Source layout

```
src/
├── App.tsx                       routes
├── main.tsx                      entry
├── index.css                     Tailwind + design tokens
├── lib/supabase.ts               browser Supabase client (stub in mock mode)
├── i18n/en.ts                    all user-facing strings (English)
├── components/
│   ├── layout/                   sticky header (logo left, profile right)
│   ├── meals/                    swipe / review / live / saved variants + helpers
│   └── *.tsx                     shared primitives (Button, Card, …)
├── pages/                        Landing, AuthVerify, CreateSession, SessionView,
│                                 VotingInterface, LiveResults, SavedMeals
├── hooks/                        useAuth, useSavedMeals, useRealtimeSession,
│                                 useGuestSession, useSwipe
├── services/                     Axios instance + per-resource API wrappers
├── types/                        snake_case types mirroring the Postgres schema
└── utils/                        storage helpers + small pure functions
```

## Realtime

The live-results screen uses Supabase Realtime via [`useRealtimeSession`](src/hooks/useRealtimeSession.ts) — it subscribes to row changes on `session_meals` filtered by `session_id`. In mock mode it falls back to short-interval polling.

## Sharing

`SessionView` exposes three share affordances inside the share modal:

1. **Native share** — `navigator.share`. Hidden on platforms that don't support it (most desktops).
2. **Copy link** — toasts "Link copied" on success. The displayed URL pill is also tappable; tapping it copies and toasts identically.
3. **QR code** — for in-room sharing.

## Landing & status

The landing page has no header. Three sections under the logo:

1. **Contributors** — three cards from [`components/landing/Contributors.tsx`](src/components/landing/Contributors.tsx). Replace placeholder LinkedIn URLs as they come in.
2. **Tech stack & status** — from [`components/landing/TechStackStatus.tsx`](src/components/landing/TechStackStatus.tsx). Coloured dots are fed by `services/status.service.ts` polling `/api/system/status`. Resend is listed without a dot — Supabase abstracts SMTP and there's no probe path back.
3. **Privacy modal** — [`components/landing/PrivacyButton.tsx`](src/components/landing/PrivacyButton.tsx).
