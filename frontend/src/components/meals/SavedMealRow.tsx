// Compact row for "My Food" — image thumb + title + ingredient summary.
// The actual swipe-to-delete and drag-handle interactions are wrapped on top
// in SwipeToDeleteRow and SortableMealRow.
//
// Tapping the row body (not the handle, not the checkbox) fires `onClick` —
// used in the manage variant to open the detail modal.

import type { SavedMeal } from '../../types';

interface Props {
    meal: SavedMeal;
    /** When true, render a small bullet column instead of an interactive zone. */
    selectable?: boolean;
    selected?: boolean;
    onToggle?: () => void;
    disabled?: boolean;
    /** Tap handler for the row content. */
    onClick?: () => void;
}

export const SavedMealRow = ({
    meal,
    selectable,
    selected,
    onToggle,
    disabled,
    onClick,
}: Props) => {
    const containerClasses = `flex items-center bg-white rounded-2xl overflow-hidden shadow-sm border ${
        selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent'
    } ${disabled ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer hover:border-orange-300 transition-colors' : ''}`;

    return (
        <div className={containerClasses}>
            {selectable && (
                <label
                    className="flex items-center justify-center pl-3 pr-1 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={!!selected}
                        disabled={disabled && !selected}
                        onChange={onToggle}
                        className="w-5 h-5 accent-orange-500 cursor-pointer"
                    />
                </label>
            )}
            {/* Body — clickable when onClick is provided. Wrapped as a button
                so keyboard activation works. */}
            <button
                type="button"
                onClick={onClick}
                disabled={!onClick}
                className="flex-1 flex items-center text-left disabled:cursor-default min-w-0"
            >
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100">
                    {meal.image_url ? (
                        <img
                            src={meal.image_url}
                            alt={meal.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full grid place-items-center text-gray-400 text-2xl">
                            🍽️
                        </div>
                    )}
                </div>
                <div className="flex-1 p-3 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{meal.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{meal.description}</p>
                </div>
            </button>
        </div>
    );
};

// Made with Bob
