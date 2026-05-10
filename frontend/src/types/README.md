# Types

Single barrel file: [`index.ts`](index.ts).

Mirrors the Supabase schema in [`../../../supabase/migrations/0001_init.sql`](../../../supabase/migrations/0001_init.sql) using snake_case fields:

- `Session`, `SessionWithMeals`, `SessionMeal`, `SessionStatus`
- `Ingredient`
- `SavedMeal`
- `VoteValue`
- `AuthUser`, `DietaryRestrictions` (frontend-only convenience)

Rule of thumb: when the schema changes, update these types and the matching backend types in [`../../../backend/src/types/`](../../../backend/src/types/) in the same commit.
