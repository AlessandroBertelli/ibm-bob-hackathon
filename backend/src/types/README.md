# Types

| File | Purpose |
|---|---|
| auth.types.ts | `AuthUser`, `AuthRequest` (Express request augmented with `user`). |
| session.types.ts | `Session`, `SessionWithMeals`, `SessionMeal`, `SessionStatus`, `VoteValue`, `Ingredient`, `ScaledIngredient`, `CreateSessionRequest`, `CastVoteRequest`. |
| ai.types.ts | `GeneratedMeal` (raw LLM output, base ingredient quantities), `AssembledMeal` (post-image, post-scaling), `ChatMessage`. |
| saved-meal.types.ts | `SavedMeal`, `CreateSavedMealRequest`, `ReorderSavedMealsRequest`. |

All field names mirror the Supabase schema in [`../../../supabase/migrations/0001_init.sql`](../../../supabase/migrations/0001_init.sql) using snake_case. The frontend types in [`../../../frontend/src/types/index.ts`](../../../frontend/src/types/index.ts) intentionally use the same names so JSON payloads pass through unchanged.
