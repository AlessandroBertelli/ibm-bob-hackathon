# Utils

| File | Purpose |
|---|---|
| errors.util.ts | `ApiError` base + `AuthenticationError`, `AuthorizationError`, `ValidationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `InternalServerError`, `ServiceUnavailableError`. Plus `formatErrorResponse` used by the shared route wrapper. |
| validation.util.ts | Per-endpoint validators: `validateCreateSession`, `validateCastVote`, `validateMintGuest`, `validateCreateSavedMeal`, `validateReorderSavedMeals`. Plus `isUuid` and `sanitizeString` helpers. Each validator throws `ValidationError` on bad input and returns a normalised typed value on success. |
