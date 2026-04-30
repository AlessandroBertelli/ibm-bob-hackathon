// Recipe detail modal component

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { formatIngredientDisplay } from '../utils/helpers';
import type { Meal } from '../types';

interface RecipeModalProps {
    meal: Meal | null;
    isOpen: boolean;
    onClose: () => void;
}

export const RecipeModal = ({ meal, isOpen, onClose }: RecipeModalProps) => {
    if (!meal) return null;

    // Generate simple cooking instructions based on meal type
    const generateInstructions = (mealTitle: string): string[] => {
        const title = mealTitle.toLowerCase();

        if (title.includes('burger') || title.includes('sandwich')) {
            return [
                'Prepare all ingredients and have them ready at room temperature.',
                'Season the protein with salt, pepper, and your favorite spices.',
                'Heat a skillet or grill to medium-high heat.',
                'Cook the protein until it reaches the desired doneness (about 4-5 minutes per side).',
                'Toast the buns lightly on the grill or in a toaster.',
                'Assemble the burger/sandwich with your prepared toppings.',
                'Serve immediately while hot and enjoy!',
            ];
        } else if (title.includes('wings') || title.includes('chicken')) {
            return [
                'Preheat your oven to 425°F (220°C) or prepare your deep fryer.',
                'Pat the chicken dry with paper towels for crispy skin.',
                'Season generously with salt, pepper, and spices.',
                'If baking: arrange on a wire rack over a baking sheet and bake for 40-45 minutes, flipping halfway.',
                'If frying: heat oil to 375°F and fry in batches for 8-10 minutes until golden.',
                'Toss with your favorite sauce while still hot.',
                'Let rest for 5 minutes before serving.',
            ];
        } else if (title.includes('pasta') || title.includes('mac')) {
            return [
                'Bring a large pot of salted water to a boil.',
                'Cook pasta according to package directions until al dente.',
                'While pasta cooks, prepare your sauce in a separate pan.',
                'Reserve 1 cup of pasta water before draining.',
                'Drain pasta and add to the sauce pan.',
                'Toss together, adding pasta water as needed for consistency.',
                'Serve hot with garnishes and enjoy!',
            ];
        } else if (title.includes('salad')) {
            return [
                'Wash and thoroughly dry all greens and vegetables.',
                'Chop vegetables into bite-sized pieces.',
                'Prepare the dressing by whisking together oil, vinegar, and seasonings.',
                'In a large bowl, combine all salad ingredients.',
                'Add dressing just before serving and toss gently.',
                'Taste and adjust seasoning as needed.',
                'Serve immediately for best texture.',
            ];
        } else if (title.includes('pizza')) {
            return [
                'Preheat oven to 475°F (245°C) with pizza stone if available.',
                'Roll out pizza dough on a floured surface to desired thickness.',
                'Transfer to a pizza peel or baking sheet.',
                'Spread sauce evenly, leaving a border for the crust.',
                'Add cheese and your favorite toppings.',
                'Bake for 12-15 minutes until crust is golden and cheese is bubbly.',
                'Let cool for 2-3 minutes, slice, and serve hot.',
            ];
        } else {
            return [
                'Gather and prepare all ingredients (mise en place).',
                'Preheat your cooking equipment to the appropriate temperature.',
                'Season ingredients with salt, pepper, and spices to taste.',
                'Cook according to your preferred method until done.',
                'Taste and adjust seasoning as needed.',
                'Plate attractively and garnish if desired.',
                'Serve hot and enjoy your meal!',
            ];
        }
    };

    const instructions = generateInstructions(meal.title);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8"
                        >
                            {/* Header with Image */}
                            <div className="relative h-64 w-full overflow-hidden">
                                <img
                                    src={meal.imageUrl}
                                    alt={meal.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Recipe';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {meal.title}
                                    </h2>
                                    <p className="text-white/90 text-sm">
                                        {meal.description}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                                >
                                    <span className="text-gray-700 text-xl">×</span>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Ingredients */}
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="text-2xl mr-2">🥘</span>
                                        Ingredients
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {meal.ingredients.map((ingredient, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start bg-orange-50 rounded-xl p-3"
                                            >
                                                <span className="text-orange-500 mr-3 text-lg">•</span>
                                                <span className="text-gray-700">
                                                    {formatIngredientDisplay(ingredient)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="text-2xl mr-2">👨‍🍳</span>
                                        Cooking Instructions
                                    </h3>
                                    <div className="space-y-4">
                                        {instructions.map((instruction, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-start"
                                            >
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                                    {index + 1}
                                                </div>
                                                <p className="text-gray-700 leading-relaxed pt-1">
                                                    {instruction}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                                        <span className="mr-2">💡</span>
                                        Pro Tips
                                    </h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Always read the entire recipe before starting</li>
                                        <li>• Prep all ingredients before you begin cooking</li>
                                        <li>• Taste and adjust seasoning throughout the process</li>
                                        <li>• Don't be afraid to customize to your preferences!</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t p-6 bg-gray-50">
                                <div className="flex gap-3">
                                    <Button
                                        variant="primary"
                                        onClick={() => window.print()}
                                        className="flex-1"
                                    >
                                        🖨️ Print Recipe
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

// Made with Bob