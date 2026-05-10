# Mock services

In-memory implementations selected when `SERVICE_MODE=mock`. Same TypeScript surface as the real services in [`..`](..), so [`../service-factory.ts`](../service-factory.ts) can swap them transparently.

| File | Replaces | Behaviour |
|---|---|---|
| mock-supabase.service.ts | supabase.service.ts | In-memory `Map`s for profiles / sessions / session_meals / guests / votes / saved_meals. Auth: any bearer of the form `mock:<email>` resolves to a deterministic UUID per email so foreign keys work across requests. `uploadMealImage` returns a Picsum placeholder URL — no actual storage. |
| mock-ai.service.ts | ai.service.ts | Picks meals from the built-in library in `mock-data.ts`, scales ingredients, returns deterministic placeholder image URLs. No OpenRouter / image-provider calls. |
| mock-data.ts | — | Curated `MEAL_TEMPLATES` (Italian / Asian / Mexican / American / Comfort) plus `getMealTemplatesByVibe` and `filterMealsByDietaryRestrictions`. Used only by the mock AI service. |

## Frontend pairing

In mock mode the frontend's Supabase client is itself stubbed at boot (see [`../../../../frontend/src/lib/supabase.ts`](../../../../frontend/src/lib/supabase.ts)) so no network call is ever made. The frontend stores `Bearer mock:<email>` in `localStorage` after the user types any email on the landing page; the Axios interceptor sends it on every request.

## Caveats

- Data is lost when the process restarts.
- OpenRouter / image providers never run, so you can't validate real LLM JSON parsing or image generation against mock mode.
- The mock data set is small (~20 meals) — repeated dietary filtering will reuse the same items.
