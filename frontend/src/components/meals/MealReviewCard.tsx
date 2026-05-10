// Compact card used on the host's review screen (Screen 2). Clicking the card
// surface opens the detail modal; the heart button in the corner stops
// propagation so it doesn't also trigger the click.

import { motion } from 'framer-motion';
import type { SessionMeal } from '../../types';
import { formatIngredientDisplay } from '../../utils/helpers';
import { HeartSaveButton } from './HeartSaveButton';
import { t } from '../../i18n/en';

interface Props {
    meal: SessionMeal;
    onClick?: () => void;
    savedTitles?: Map<string, string>;
    onSaveChange?: () => void;
}

export const MealReviewCard = ({ meal, onClick, savedTitles, onSaveChange }: Props) => {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="text-left bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col hover:shadow-2xl transition-shadow w-full"
        >
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                {meal.image_url ? (
                    <img
                        src={meal.image_url}
                        alt={meal.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full grid place-items-center text-gray-400 text-5xl">
                        🍽️
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <HeartSaveButton
                        meal={meal}
                        savedTitles={savedTitles}
                        onChange={onSaveChange}
                    />
                </div>
            </div>
            <div className="p-5 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{meal.title}</h3>
                <p className="text-gray-700 text-sm line-clamp-3 mb-3">{meal.description}</p>
                {meal.ingredients.length > 0 && (
                    <ul className="space-y-1 text-sm text-gray-600">
                        {meal.ingredients.slice(0, 5).map((ing, i) => (
                            <li key={i}>• {formatIngredientDisplay(ing)}</li>
                        ))}
                        {meal.ingredients.length > 5 && (
                            <li className="text-gray-400 italic">
                                {t.detail.moreIngredients(meal.ingredients.length - 5)}
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </motion.button>
    );
};

// Made with Bob
