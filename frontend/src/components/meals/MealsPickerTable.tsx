// "My Food" table — used in two modes:
//
//   variant="picker": checkboxes (max 4 selected), drag-drop reorders the
//     SELECTED list at the top. Used on Screen 1 (CreateSession).
//
//   variant="manage": no checkboxes, drag-drop reorders the ENTIRE list,
//     swipe-left to delete. Used on /profile/saved-meals.
//
// Both modes share a sticky live-search input.

import { useMemo, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { SavedMeal } from '../../types';
import { SavedMealRow } from './SavedMealRow';
import { SortableMealRow } from './SortableMealRow';
import { SwipeToDeleteRow } from './SwipeToDeleteRow';
import { t } from '../../i18n/en';

interface PickerProps {
    variant: 'picker';
    meals: SavedMeal[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    maxSelected?: number;
}

interface ManageProps {
    variant: 'manage';
    meals: SavedMeal[];
    onReorder: (orderedIds: string[]) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    /** Tap on the row body — typically opens the detail modal. */
    onRowClick?: (meal: SavedMeal) => void;
}

type Props = PickerProps | ManageProps;

const MAX_SELECTED_DEFAULT = 4;

function filterMeals(meals: SavedMeal[], query: string): SavedMeal[] {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((m) => {
        const haystack = [m.title, m.description, ...m.ingredients.map((i) => i.name)]
            .join(' ')
            .toLowerCase();
        return haystack.includes(q);
    });
}

export const MealsPickerTable = (props: Props) => {
    const [query, setQuery] = useState('');

    // Long-press to start drag (delay-based) so the entire row can be the
    // drag activator without stealing every tap. Tap < delay = onClick fires.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const visible = useMemo(() => filterMeals(props.meals, query), [props.meals, query]);

    /* ------------------------------- picker ------------------------------ */
    if (props.variant === 'picker') {
        const max = props.maxSelected ?? MAX_SELECTED_DEFAULT;
        const selectedSet = new Set(props.selectedIds);
        const selectedMeals = props.selectedIds
            .map((id) => props.meals.find((m) => m.id === id))
            .filter((m): m is SavedMeal => Boolean(m));
        const remainingMeals = visible.filter((m) => !selectedSet.has(m.id));

        const handleSortEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = props.selectedIds.indexOf(String(active.id));
            const newIndex = props.selectedIds.indexOf(String(over.id));
            if (oldIndex < 0 || newIndex < 0) return;
            props.onSelectionChange(arrayMove(props.selectedIds, oldIndex, newIndex));
        };

        const toggle = (id: string) => {
            if (selectedSet.has(id)) {
                props.onSelectionChange(props.selectedIds.filter((x) => x !== id));
            } else if (props.selectedIds.length < max) {
                props.onSelectionChange([...props.selectedIds, id]);
            }
        };

        const limitReached = props.selectedIds.length >= max;

        return (
            <div className="space-y-3">
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.create.searchPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white"
                />

                {props.meals.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">{t.create.emptyMyFood}</p>
                ) : (
                    <>
                        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                            <span>{t.create.selectedCount(props.selectedIds.length)}</span>
                            {limitReached && (
                                <span className="text-amber-600 font-medium">
                                    {t.create.selectionFull}
                                </span>
                            )}
                        </div>

                        {selectedMeals.length > 0 && (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleSortEnd}
                            >
                                <SortableContext
                                    items={props.selectedIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {selectedMeals.map((m) => (
                                            <SortableMealRow key={m.id} id={m.id}>
                                                <SavedMealRow
                                                    meal={m}
                                                    selectable
                                                    selected
                                                    onToggle={() => toggle(m.id)}
                                                />
                                            </SortableMealRow>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}

                        {remainingMeals.length > 0 && (
                            <div className="space-y-2 pt-1">
                                {remainingMeals.map((m) => (
                                    <SavedMealRow
                                        key={m.id}
                                        meal={m}
                                        selectable
                                        selected={false}
                                        disabled={limitReached}
                                        onToggle={() => toggle(m.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    /* ------------------------------- manage ------------------------------ */
    const orderedIds = props.meals.map((m) => m.id);
    const visibleIds = new Set(visible.map((m) => m.id));

    const handleSortEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = orderedIds.indexOf(String(active.id));
        const newIndex = orderedIds.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        props.onReorder(arrayMove(orderedIds, oldIndex, newIndex));
    };

    return (
        <div className="space-y-3">
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.myFood.searchPlaceholder}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white"
            />
            {props.meals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">{t.myFood.empty}</p>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSortEnd}
                >
                    <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {props.meals
                                .filter((m) => visibleIds.has(m.id))
                                .map((m) => (
                                    <SortableMealRow key={m.id} id={m.id}>
                                        <SwipeToDeleteRow onDelete={() => props.onDelete(m.id)}>
                                            <SavedMealRow
                                                meal={m}
                                                onClick={
                                                    props.onRowClick
                                                        ? () => props.onRowClick!(m)
                                                        : undefined
                                                }
                                            />
                                        </SwipeToDeleteRow>
                                    </SortableMealRow>
                                ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};

// Made with Bob
