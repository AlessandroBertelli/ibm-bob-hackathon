// "My Food" data hook with optimistic updates.

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { SavedMeal } from '../types';
import * as savedMealsService from '../services/savedMeals.service';

interface UseSavedMealsReturn {
    meals: SavedMeal[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    save: (input: savedMealsService.CreateSavedMealInput) => Promise<SavedMeal>;
    reorder: (orderedIds: string[]) => Promise<void>;
    remove: (id: string) => Promise<void>;
}

export const useSavedMeals = (enabled = true): UseSavedMealsReturn => {
    const [meals, setMeals] = useState<SavedMeal[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const list = await savedMealsService.listSavedMeals();
            setMeals(list);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (enabled) refresh();
    }, [enabled, refresh]);

    const save = useCallback(
        async (input: savedMealsService.CreateSavedMealInput) => {
            const created = await savedMealsService.createSavedMeal(input);
            setMeals((current) => {
                const without = current.filter((m) => m.id !== created.id);
                return [...without, created].sort((a, b) => a.position - b.position);
            });
            return created;
        },
        []
    );

    const reorder = useCallback(
        async (orderedIds: string[]) => {
            const previous = meals;
            const lookup = new Map(meals.map((m) => [m.id, m]));
            const next: SavedMeal[] = orderedIds
                .map((id, i) => {
                    const m = lookup.get(id);
                    return m ? { ...m, position: i } : null;
                })
                .filter((m): m is SavedMeal => m !== null);
            setMeals(next);
            try {
                await savedMealsService.reorderSavedMeals(orderedIds);
            } catch (err) {
                setMeals(previous);
                toast.error('Could not save the new order');
                throw err;
            }
        },
        [meals]
    );

    const remove = useCallback(
        async (id: string) => {
            const previous = meals;
            setMeals((current) => current.filter((m) => m.id !== id));
            try {
                await savedMealsService.deleteSavedMeal(id);
            } catch (err) {
                setMeals(previous);
                toast.error('Delete failed');
                throw err;
            }
        },
        [meals]
    );

    return { meals, isLoading, error, refresh, save, reorder, remove };
};

// Made with Bob
