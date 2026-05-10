// Meal detail modal. Opens from any meal-card click. The whole panel scrolls
// as one — image and body share a single scroll, so the image can scroll
// out of view if the recipe is long. Closes via X (top-right), Escape, or
// backdrop click.
//
// Accepts the generic `DisplayMeal` shape so it works for SessionMeal AND
// SavedMeal. Heart-save is supplied by the caller via the `actions` slot —
// when the modal opens from the user's own saved-meals collection (where
// "save" is meaningless) the slot is left empty.

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DisplayMeal } from '../../types';
import { formatIngredientDisplay } from '../../utils/helpers';
import { t } from '../../i18n/en';

interface Props {
    meal: DisplayMeal | null;
    isOpen: boolean;
    onClose: () => void;
    /** Rendered top-LEFT on the image overlay (typically a HeartSaveButton). */
    actions?: ReactNode;
}

export const MealDetailModal = ({ meal, isOpen, onClose, actions }: Props) => {
    const [showRecipe, setShowRecipe] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Reset accordion when a different meal is opened.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowRecipe(false);
    }, [meal?.title]);

    return (
        <AnimatePresence>
            {isOpen && meal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 z-50 overflow-y-auto"
                >
                    {/* Centring wrapper — flex + min-h-full keeps short modals
                        vertically centered, but lets tall modals push the
                        scroll bar without clipping. */}
                    <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
                        >
                            {/* Image / header — square. Not sticky; scrolls
                                with the rest of the content. */}
                            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                                {meal.image_url ? (
                                    <img
                                        src={meal.image_url}
                                        alt={meal.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full grid place-items-center text-gray-400 text-6xl">
                                        🍽️
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                                {/* Close button — top-right */}
                                <button
                                    type="button"
                                    aria-label={t.detail.close}
                                    onClick={onClose}
                                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-gray-800 grid place-items-center shadow-md hover:bg-white transition-transform hover:scale-110"
                                >
                                    ✕
                                </button>

                                {/* Optional caller-supplied action — top-left */}
                                {actions && <div className="absolute top-3 left-3">{actions}</div>}

                                {/* Title overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <h2 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-lg">
                                        {meal.title}
                                    </h2>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                <p className="text-gray-700 leading-relaxed">{meal.description}</p>

                                {meal.ingredients.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                                            {t.detail.ingredients}
                                        </h3>
                                        <ul className="space-y-1.5 text-gray-700">
                                            {meal.ingredients.map((ing, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                                                    <span>{formatIngredientDisplay(ing)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recipe accordion. Collapsed by default — long
                                    recipes don't crowd the summary. */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowRecipe((v) => !v)}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-600 text-lg">📖</span>
                                            <span className="font-semibold text-gray-900">
                                                {showRecipe ? t.detail.hideRecipe : t.detail.showRecipe}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {meal.instructions.length > 0
                                                ? t.detail.stepCount(meal.instructions.length)
                                                : ''}
                                        </span>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {showRecipe && (
                                            <motion.div
                                                key="recipe"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4">
                                                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                                                        {t.detail.instructions}
                                                    </h3>
                                                    {meal.instructions.length > 0 ? (
                                                        <ol className="space-y-3 text-gray-700">
                                                            {meal.instructions.map((step, i) => (
                                                                <li key={i} className="flex gap-3">
                                                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white grid place-items-center text-sm font-bold">
                                                                        {i + 1}
                                                                    </span>
                                                                    <span className="leading-relaxed pt-0.5">
                                                                        {step}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">
                                                            {t.detail.noInstructions}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Made with Bob
