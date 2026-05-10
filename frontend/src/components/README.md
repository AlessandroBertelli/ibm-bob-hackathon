# Components

Reusable React UI.

## Top-level

| File | Purpose |
|---|---|
| Button.tsx | Variant-aware button (primary / secondary / outline / danger) with loading state |
| Card.tsx | Padded white container with subtle entrance animation |
| Input.tsx | Form input with label + error |
| LoadingSpinner.tsx | Animated spinner with optional caption |
| ProgressBar.tsx | Linear progress bar (currently used during voting) |
| SwipeCard.tsx | Framer-Motion-based draggable card wrapper for the voting stack |

## Layout

| File | Purpose |
|---|---|
| layout/Header.tsx | Sticky header — logo on the **left**, profile dropdown on the right |
| layout/AppLayout.tsx | Wraps every route with the header via `<Outlet />` |

## Meal-related (`meals/`)

| File | Purpose |
|---|---|
| SwipeMealCard.tsx | Tall image-led card used inside the voting card stack |
| MealReviewCard.tsx | Compact review card for the host's Screen 2 |
| MealDetailModal.tsx | Full-bleed modal — image, description, ingredients, "Recipe" accordion. Whole panel scrolls; image does **not** stick. |
| LiveResultsRow.tsx | Live-sortable row used on the results screen |
| LiveProgressBar.tsx | Animated yes / no fill bar |
| HeartSaveButton.tsx | Save-to-My-Food button; opens an inline auth dialog when anonymous |
| PublicLinkDisclosure.tsx | Banner explaining the share link is public |
| MySessionsList.tsx | Profile-page block: list of the host's own sessions with voter counts. |
| SavedMealRow.tsx | Compact row used in "My Food" |
| MealsPickerTable.tsx | Picker (max-4 checkboxes) **and** Manage (drag-reorder + swipe-delete) views |
| SortableMealRow.tsx | dnd-kit `useSortable` wrapper. Whole row is the drag activator (250 ms long-press via the delay sensor) — no separate handle. |
| SwipeToDeleteRow.tsx | Framer-Motion swipe-left drawer with trash + confirm |
| DeleteAccountButton.tsx | Two-step confirm flow that calls `DELETE /api/account` and signs out. Saved recipes survive as anonymised rows. |

## Landing (`landing/`)

| File | Purpose |
|---|---|
| Contributors.tsx | "Made with ❤ & 🍕 @ IBM Bobathon" — three cards, optional photo + LinkedIn. |
| TechStackStatus.tsx | Stack list with a coloured dot per service, fed by `/api/status`. |
| PrivacyButton.tsx | Modal with the privacy explainer. |

## Conventions

- PascalCase filenames, named exports.
- All copy comes from [`../i18n/en.ts`](../i18n/en.ts) — never inline a user-facing string.
- Colocate small variant components under `meals/` and landing-only ones under `landing/`; everything else stays at the top level.
