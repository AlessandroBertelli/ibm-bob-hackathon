// "My Food" service.

import api from './api';
import type { SavedMeal } from '../types';

/**
 * Saving is reference-only — the backend looks up the trusted title /
 * description / image_url / ingredients from the session_meal id we pass in.
 * That's a hardening choice, not a UX one (see SECURITY.md, finding M2).
 */
export interface CreateSavedMealInput {
    source_session_meal_id: string;
}

export const listSavedMeals = async (): Promise<SavedMeal[]> => {
    const { data } = await api.get<{ meals: SavedMeal[] }>('/saved-meals');
    return data.meals;
};

export const createSavedMeal = async (input: CreateSavedMealInput): Promise<SavedMeal> => {
    const { data } = await api.post<{ meal: SavedMeal }>('/saved-meals', input);
    return data.meal;
};

export const reorderSavedMeals = async (orderedIds: string[]): Promise<void> => {
    await api.patch('/saved-meals/reorder', { ordered_ids: orderedIds });
};

export const deleteSavedMeal = async (id: string): Promise<void> => {
    await api.delete(`/saved-meals/${id}`);
};

// Made with Bob
