// Results display page (Screen 4) - Shows voting results

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RecipeModal } from '../components/RecipeModal';
import { formatIngredientDisplay } from '../utils/helpers';
import * as sessionService from '../services/session.service';
import * as voteService from '../services/vote.service';
import type { Meal } from '../types';
import toast from 'react-hot-toast';

interface MealWithVotes extends Meal {
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
    percentage: number;
}

export const Winner = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [results, setResults] = useState<MealWithVotes[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewRecipe = (meal: MealWithVotes) => {
        setSelectedMeal(meal);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const loadResults = async () => {
            if (!sessionId) return;

            try {
                // Get session with meals
                const session = await sessionService.getSession(sessionId);

                // Get vote stats for each meal
                const mealsWithVotes = await Promise.all(
                    session.meals.map(async (meal) => {
                        try {
                            const stats = await voteService.getMealStats(sessionId, meal.id);
                            return {
                                ...meal,
                                yesVotes: stats.yes_votes,
                                noVotes: stats.no_votes,
                                totalVotes: stats.total_votes,
                                percentage: stats.vote_percentage,
                            };
                        } catch (err) {
                            console.error(`Failed to load stats for meal ${meal.id}:`, err);
                            return {
                                ...meal,
                                yesVotes: 0,
                                noVotes: 0,
                                totalVotes: 0,
                                percentage: 0,
                            };
                        }
                    })
                );

                // Sort by yes votes (highest first)
                mealsWithVotes.sort((a, b) => {
                    if (b.yesVotes !== a.yesVotes) {
                        return b.yesVotes - a.yesVotes;
                    }
                    return b.percentage - a.percentage;
                });

                setResults(mealsWithVotes);
            } catch (err) {
                console.error('Failed to load results:', err);
                setError('Failed to load voting results');
                toast.error('Failed to load results');
            } finally {
                setIsLoading(false);
            }
        };

        // Load results immediately
        loadResults();

        // Set up polling every 3 seconds to get real-time updates
        const interval = setInterval(() => {
            loadResults();
        }, 3000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [sessionId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading results..." />
            </div>
        );
    }

    if (error || results.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        No Results Yet
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error || 'No voting data available. Start voting to see results!'}
                    </p>
                    <Button variant="primary" onClick={() => navigate('/')} fullWidth>
                        Back to Home
                    </Button>
                </Card>
            </div>
        );
    }

    const topMeal = results[0];
    const hasVotes = topMeal.totalVotes > 0;

    return (
        <div className="min-h-screen p-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="text-center mb-8"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                        className="inline-block mb-4"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                            <span className="text-5xl">📊</span>
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl font-bold text-gray-900 mb-2"
                    >
                        Voting Results
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600 text-xl"
                    >
                        {hasVotes ? 'Live Results - Updates automatically' : 'No votes yet - start voting!'}
                    </motion.p>
                    {hasVotes && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500"
                        >
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Updating every 3 seconds</span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Results List */}
                <div className="space-y-4">
                    {results.map((meal, index) => (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                        >
                            <Card className="overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    {/* Meal Image */}
                                    <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden">
                                        <img
                                            src={meal.imageUrl}
                                            alt={meal.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Meal';
                                            }}
                                        />
                                        {index === 0 && meal.yesVotes > 0 && (
                                            <div className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold text-sm shadow-lg">
                                                🏆 Top Choice
                                            </div>
                                        )}
                                    </div>

                                    {/* Meal Details */}
                                    <div className="flex-1 p-6">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900 flex-1">
                                                {meal.title}
                                            </h3>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleViewRecipe(meal)}
                                                className="ml-4 text-sm"
                                            >
                                                📖 Recipe
                                            </Button>
                                        </div>
                                        <p className="text-gray-600 mb-4 line-clamp-2">
                                            {meal.description}
                                        </p>

                                        {/* Vote Stats */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">
                                                    👍 Yes Votes
                                                </span>
                                                <span className="text-lg font-bold text-green-600">
                                                    {meal.yesVotes}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">
                                                    👎 No Votes
                                                </span>
                                                <span className="text-lg font-bold text-red-600">
                                                    {meal.noVotes}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Approval Rate
                                                </span>
                                                <span className="text-lg font-bold text-orange-600">
                                                    {meal.totalVotes > 0 ? `${Math.round(meal.percentage)}%` : 'N/A'}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            {meal.totalVotes > 0 && (
                                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${meal.percentage}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Show ingredients for top choice */}
                                        {index === 0 && meal.yesVotes > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <h4 className="text-sm font-bold text-gray-900 mb-2">
                                                    Ingredients:
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {meal.ingredients.slice(0, 6).map((ingredient, idx) => (
                                                        <div key={idx} className="text-xs text-gray-600">
                                                            • {formatIngredientDisplay(ingredient)}
                                                        </div>
                                                    ))}
                                                    {meal.ingredients.length > 6 && (
                                                        <div className="text-xs text-gray-500 italic">
                                                            +{meal.ingredients.length - 6} more...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                >
                    <Button
                        variant="primary"
                        onClick={() => navigate('/')}
                        fullWidth
                    >
                        Start New Session
                    </Button>
                    {hasVotes && (
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            fullWidth
                        >
                            Print Results
                        </Button>
                    )}
                </motion.div>

                {/* Recipe Modal */}
                <RecipeModal
                    meal={selectedMeal}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </div>
    );
};

// Made with Bob
