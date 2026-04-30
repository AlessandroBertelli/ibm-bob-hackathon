// Meal card component for displaying meal information

import type { Meal } from '../types';
import { formatIngredientDisplay } from '../utils/helpers';

interface MealCardProps {
    meal: Meal;
    showIngredients?: boolean;
    className?: string;
}

export const MealCard = ({
    meal,
    showIngredients = true,
    className = '',
}: MealCardProps) => {
    return (
        <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}>
            {/* Meal Image */}
            <div className="relative h-64 w-full overflow-hidden">
                <img
                    src={meal.imageUrl}
                    alt={meal.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback image if loading fails
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Delicious+Meal';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Meal Info */}
            <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{meal.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{meal.description}</p>

                {/* Ingredients */}
                {showIngredients && meal.ingredients && meal.ingredients.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Ingredients:
                        </h4>
                        <ul className="space-y-1">
                            {meal.ingredients.slice(0, 5).map((ingredient, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-orange-500 mr-2">•</span>
                                    <span>{formatIngredientDisplay(ingredient)}</span>
                                </li>
                            ))}
                            {meal.ingredients.length > 5 && (
                                <li className="text-sm text-gray-500 italic">
                                    +{meal.ingredients.length - 5} more ingredients
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

// Made with Bob
