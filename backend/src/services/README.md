# Services

Business logic and external integrations. Handlers in [`../../../api/`](../../../api/) import via [`service-factory.ts`](service-factory.ts), which swaps real for mock based on `SERVICE_MODE`.

| File | Real / mock | Responsibility |
|---|---|---|
| supabase.service.ts | real | Postgres + Auth + Storage admin client. Also exposes the SECURITY DEFINER RPC wrappers used by tracking, status, digests, and account deletion (see below). |
| openrouter.service.ts | real | LLM chat completion with model rotation |
| imagegen/index.ts | real | Image-provider orchestrator (rotation + Storage upload + magic-byte validation + 5 MB cap) |
| imagegen/pollinations.ts | real | Pollinations.ai provider |
| imagegen/huggingface.ts | real | Hugging Face Inference provider (FLUX.1-schnell) |
| imagegen/cloudflare.ts | real | Cloudflare Workers AI provider (FLUX-1-schnell) |
| ai.service.ts | real | Orchestrates LLM + image generation + ingredient scaling. Prompt is English with metric-only units (g, kg, ml, l, tsp, tbsp, pinch, piece, clove, bunch). |
| session.flow.ts | real | Build the 4-meal payload (selected saved + generated) for create + regenerate |
| service-factory.ts | both | Picks real or mock at startup based on `SERVICE_MODE` |
| mock/mock-supabase.service.ts | mock | In-memory data; accepts `Bearer mock:<email>` tokens; tracking / digest helpers are no-ops |
| mock/mock-ai.service.ts | mock | Picks meals from the built-in library, deterministic placeholder image URLs |
| mock/mock-data.ts | mock | The built-in meal library |

The real `dataService` and `aiService` exports both have the same TypeScript surface as the mock equivalents — that's deliberate, the factory cast preserves type safety.

### Helpers on `dataService` worth knowing

- `deleteAuthUser(userId)` — used by `DELETE /api/account`. Deletes the auth user; FK on `saved_meals.user_id` is `ON DELETE SET NULL`, so saved recipes survive as anonymised rows.
- `recordServiceOutcome(service, ok, detail)` — every external call (LLM, each image provider, Resend) upserts into `service_status`. `listServiceStatus()` reads it for `/api/status`.
- `recordEvent(kind, payload)` / `recordError(area, message, context)` — lightweight tracking. Trimmed by `cleanupAfterDigest`.
- `getWeeklyDigestData()` / `cleanupAfterDigest()` — used only by `api/_cron/weekly-stats.ts`.
- `listMySessions(userId)` — `GET /api/sessions/mine`, with voter counts.

## OpenRouter rotation

`openrouter.service.ts` reads `OPENROUTER_MODELS` (comma-separated, ordered) and tries each in turn. On 429 / 5xx / timeout / empty response it rotates; on a non-retryable 4xx it stops. If every model fails the route returns 503.

## Image-gen rotation

`imagegen/index.ts` reads `IMAGE_PROVIDERS` (e.g. `pollinations,huggingface,cloudflare`) and tries each provider in order. The first to return image bytes wins; the bytes are uploaded to the `meal-images` Supabase Storage bucket and the public URL is returned. If every provider fails, the route returns 503.

Each provider lives in its own file with a single exported function `(prompt: string) => Promise<{ bytes, contentType }>`. Adding a new provider is one new file plus one entry in `PROVIDERS` in `imagegen/index.ts`.

## Auth

The backend never issues auth tokens — Supabase Auth handles that. `supabase.service.ts#getUserFromAccessToken` verifies bearer tokens; the mock equivalent accepts any `mock:<email>` token and derives a deterministic UUID per email so foreign keys remain stable across requests.
