# Utils

Pure helpers and small persisted-state utilities.

| File | Purpose |
|---|---|
| storage.ts | LocalStorage helpers: per-session guest tokens, the post-sign-in redirect path, and the mock-mode auth token. Wrapped in try/catch so private-mode browsers don't crash. |
| helpers.ts | `formatIngredientDisplay`, `copyToClipboard`, `validateEmail`, `getShareUrl`, `getResultsUrl`, `debounce`. |

User-facing strings go in [`../i18n/en.ts`](../i18n/en.ts) — never hardcode them here.
