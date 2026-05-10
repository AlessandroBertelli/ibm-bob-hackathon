/**
 * Shared session-creation flow used by both create + regenerate handlers.
 * Pulls saved meals (if any), asks the AI for the rest, returns the row
 * payloads ready to insert into session_meals.
 *
 * Pre-selected meal titles are passed to the AI as an exclusion list so the
 * generated cards don't duplicate something the host already chose.
 */

import { ScaledIngredient } from '../types/session.types';
import { dataService, aiService } from './service-factory';

export interface BuildSessionMealsInput {
    userId: string;
    sessionId: string;
    selectedSavedMealIds: string[];
    vibe: string;
    headcount: number;
    dietary: string[];
}

export interface SessionMealPayload {
    title: string;
    description: string;
    image_url: string | null;
    ingredients: ScaledIngredient[];
    instructions: string[];
    position: number;
    source_saved_meal_id: string | null;
}

export async function buildSessionMeals(
    input: BuildSessionMealsInput
): Promise<SessionMealPayload[]> {
    const fromSaved = input.selectedSavedMealIds.length
        ? await dataService.getSavedMealsByIds(input.userId, input.selectedSavedMealIds)
        : [];

    // Preserve the ordering the user supplied.
    const orderedSaved = input.selectedSavedMealIds
        .map((id) => fromSaved.find((m) => m.id === id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));

    const remaining = 4 - orderedSaved.length;
    const excludedTitles = orderedSaved.map((m) => m.title);

    const generated = remaining > 0
        ? await aiService.generateAssembledMeals({
              sessionId: input.sessionId,
              vibe: input.vibe,
              headcount: input.headcount,
              dietary: input.dietary,
              count: remaining,
              excludedTitles,
          })
        : [];

    return [
        ...orderedSaved.map((m, i) => ({
            title: m.title,
            description: m.description,
            image_url: m.image_url,
            ingredients: m.ingredients,
            instructions: m.instructions ?? [],
            position: i,
            source_saved_meal_id: m.id,
        })),
        ...generated.map((g, i) => ({
            title: g.title,
            description: g.description,
            image_url: g.image_url,
            ingredients: g.ingredients,
            instructions: g.instructions,
            position: orderedSaved.length + i,
            source_saved_meal_id: null,
        })),
    ];
}

// Made with Bob
