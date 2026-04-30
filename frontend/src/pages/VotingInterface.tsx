// Tinder-style voting interface (Screen 3 - Guest View)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SwipeCard } from '../components/SwipeCard';
import { MealCard } from '../components/MealCard';
import { ProgressBar } from '../components/ProgressBar';
import { useSwipe } from '../hooks/useSwipe';
import { useSession } from '../hooks/useSession';
import { generateGuestId } from '../utils/helpers';
import { getGuestId, setGuestId } from '../utils/storage';
import * as voteService from '../services/vote.service';
import type { VotingProgress } from '../types';
import { VoteType } from '../types';
import toast from 'react-hot-toast';

export const VotingInterface = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { session, isLoading, error, loadSessionByToken } = useSession();
    const [guestId] = useState<string>(() => {
        // Initialize guest ID on mount
        let id = getGuestId();
        if (!id) {
            id = generateGuestId();
            setGuestId(id);
        }
        return id;
    });
    const [isVoting, setIsVoting] = useState(false);
    const [votingComplete, setVotingComplete] = useState(false);
    const [showStatus, setShowStatus] = useState(false);
    const [votingProgress, setVotingProgress] = useState<VotingProgress | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);

    // Load session by token
    useEffect(() => {
        if (token) {
            loadSessionByToken(token);
        }
    }, [token, loadSessionByToken]);

    // Auto-refresh voting progress when status is shown
    useEffect(() => {
        if (!showStatus || !session) return;

        const fetchVotingProgress = async () => {
            setIsLoadingProgress(true);
            try {
                const progress = await voteService.getProgress(session.id);
                setVotingProgress(progress);
            } catch (err) {
                console.error('Failed to fetch voting progress:', err);
            } finally {
                setIsLoadingProgress(false);
            }
        };

        // Fetch immediately
        fetchVotingProgress();

        // Set up polling every 3 seconds
        const interval = setInterval(fetchVotingProgress, 3000);

        return () => clearInterval(interval);
    }, [showStatus, session]);

    const handleVote = async (mealIndex: number, voteType: VoteType) => {
        if (!session || !guestId) return;

        const meal = session.meals[mealIndex];
        setIsVoting(true);

        try {
            await voteService.submitVote(session.id, guestId, meal.id, voteType);
        } catch (err) {
            console.error('Failed to submit vote:', err);
            toast.error('Failed to submit vote');
        } finally {
            setIsVoting(false);
        }
    };

    const {
        currentIndex,
        swipeLeft,
        swipeRight,
        handleDragEnd,
    } = useSwipe({
        totalCards: session?.meals.length || 0,
        onSwipeLeft: (index) => handleVote(index, VoteType.NO),
        onSwipeRight: (index) => handleVote(index, VoteType.YES),
        onComplete: () => {
            setVotingComplete(true);
            toast.success('Voting complete! Waiting for others...');
        },
    });

    // Handle missing token
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Invalid Link
                    </h2>
                    <p className="text-gray-600 mb-6">
                        This voting link is invalid or incomplete. Please request a new link from the session host.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/')}
                        fullWidth
                    >
                        Go to Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    // Handle error loading session
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Session Not Found
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error}
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/')}
                        fullWidth
                    >
                        Go to Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (isLoading || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading session..." />
            </div>
        );
    }

    if (votingComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        All Done!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Waiting for others to finish voting...
                    </p>
                    <ProgressBar
                        current={currentIndex}
                        total={session.meals.length}
                        label="Your Progress"
                    />

                    {/* Show Current Status Button - Navigate to Results */}
                    <Button
                        variant="primary"
                        onClick={() => navigate(`/winner/${session.id}`)}
                        fullWidth
                        className="mt-6"
                    >
                        Show Current Status
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => navigate(`/winner/${session.id}`)}
                        fullWidth
                        className="mt-4"
                    >
                        Check Results
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4"
            >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {session.vibe}
                </h1>
                <ProgressBar
                    current={currentIndex}
                    total={session.meals.length}
                    label="Progress"
                    className="max-w-md mx-auto"
                />
            </motion.div>

            {/* Swipe Card Area */}
            <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-md h-150">
                    {session.meals.map((meal, index) => {
                        if (index < currentIndex) return null;

                        return (
                            <SwipeCard
                                key={meal.id}
                                onSwipeLeft={swipeLeft}
                                onSwipeRight={swipeRight}
                                onDragEnd={handleDragEnd}
                                className={index === currentIndex ? 'z-10' : 'z-0'}
                            >
                                <MealCard meal={meal} showIngredients={false} />
                            </SwipeCard>
                        );
                    })}
                </div>
            </div>

            {/* Action Buttons (for desktop/non-touch) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-center max-w-md mx-auto w-full mt-4"
            >
                <Button
                    variant="danger"
                    onClick={swipeLeft}
                    disabled={isVoting}
                    className="flex-1"
                >
                    <span className="text-2xl">👎</span>
                    <span>No</span>
                </Button>
                <Button
                    variant="secondary"
                    onClick={swipeRight}
                    disabled={isVoting}
                    className="flex-1"
                >
                    <span className="text-2xl">👍</span>
                    <span>Yes</span>
                </Button>
            </motion.div>

            {/* Show Current Status Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
            >
                <Button
                    variant="outline"
                    onClick={() => setShowStatus(!showStatus)}
                    fullWidth
                    className="max-w-md mx-auto"
                >
                    {showStatus ? 'Hide Status' : 'Show Current Status'}
                </Button>

                {/* Voting Status Display */}
                <AnimatePresence>
                    {showStatus && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-white rounded-xl shadow-lg max-w-md mx-auto"
                        >
                            {isLoadingProgress ? (
                                <LoadingSpinner size="sm" text="Loading status..." />
                            ) : votingProgress ? (
                                <div className="space-y-3">
                                    <div className="text-left">
                                        <p className="text-sm text-gray-600 mb-1">Group Progress</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold text-gray-900">
                                                {votingProgress.guestsCompleted} / {votingProgress.totalGuests}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {Math.round(votingProgress.progressPercentage)}% complete
                                            </span>
                                        </div>
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${votingProgress.progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    {votingProgress.progressPercentage === 100 && (
                                        <p className="text-sm text-green-600 font-medium">
                                            🎉 Everyone has voted! Check results below.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Unable to load status</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Instructions */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-500 text-sm mt-4"
            >
                Swipe left for No, right for Yes
            </motion.p>
        </div>
    );
};

// Made with Bob
