/**
 * "My Food" saved-meal types — mirror the saved_meals table.
 */

import { ScaledIngredient } from './session.types';

export interface SavedMeal {
    id: string;
    user_id: string;
    title: string;
    description: string;
    image_url: string | null;
    ingredients: ScaledIngredient[];
    instructions: string[];
    position: number;
    created_at: string;
}

/**
 * Saving "My Food" entries is reference-only — the client passes the
 * session_meal id and the backend copies the trusted fields (title,
 * description, image_url, ingredients) over. Prevents host-spoofed image URLs
 * and arbitrary text injection.
 */
export interface CreateSavedMealRequest {
    source_session_meal_id: string;
}

export interface ReorderSavedMealsRequest {
    /** Full list of ids in the new desired order. */
    ordered_ids: string[];
}

// Made with Bob
