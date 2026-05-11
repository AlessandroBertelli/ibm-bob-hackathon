// Screen 3 — Guest swipe voting. One card stack, two action buttons, single
// "see live results" CTA when done. No inline status panel, no winner page.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SwipeCard } from '../components/SwipeCard';
import { ProgressBar } from '../components/ProgressBar';
import { SwipeMealCard } from '../components/meals/SwipeMealCard';
import { useSwipe } from '../hooks/useSwipe';
import { useGuestSession } from '../hooks/useGuestSession';
import { castVote } from '../services/vote.service';
import { getSessionByToken } from '../services/session.service';
import type { SessionWithMeals, VoteValue } from '../types';
import { t } from '../i18n/en';

export const VotingInterface = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [session, setSession] = useState<SessionWithMeals | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!token);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [votingMeal, setVotingMeal] = useState<string | null>(null);

    const { token: guestToken, error: guestError } = useGuestSession(session?.id);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            try {
                const s = await getSessionByToken(token);
                if (!cancelled) setSession(s);
            } catch (err) {
                if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Error');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token]);

    const submitVote = async (idx: number, value: VoteValue) => {
        if (!session || !guestToken) return;
        const meal = session.meals[idx];
        setVotingMeal(meal.id);
        try {
            await castVote(guestToken, meal.id, value);
        } catch (err) {
            console.error('Vote failed:', err);
            toast.error(t.vote.voteError);
        } finally {
            setVotingMeal(null);
        }
    };

    const { currentIndex, swipeLeft, swipeRight, handleDragEnd } = useSwipe({
        totalCards: session?.meals.length || 0,
        onSwipeLeft: (i) => submitVote(i, 'no'),
        onSwipeRight: (i) => submitVote(i, 'yes'),
        onComplete: () => setCompleted(true),
    });

    if (!token) {
        return (
            <div className="min-h-[80vh] grid place-items-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full grid place-items-center mx-auto mb-4">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {t.vote.invalidLinkTitle}
                    </h2>
                    <p className="text-gray-600 mb-6">{t.vote.invalidLinkBody}</p>
                    <Button variant="primary" fullWidth onClick={() => navigate('/')}>
                        {t.vote.toHome}
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (loadError || guestError) {
        const isNotFound = loadError?.includes('404') || guestError?.includes('404') || 
                           loadError?.toLowerCase().includes('not found') || 
                           guestError?.toLowerCase().includes('not found');
        return (
            <div className="min-h-[80vh] grid place-items-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full grid place-items-center mx-auto mb-4">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isNotFound ? t.vote.notFoundTitle : t.common.error}
                    </h2>
                    {!isNotFound && (
                        <p className="text-gray-600 mb-6">{loadError || guestError}</p>
                    )}
                    <Button variant="primary" fullWidth onClick={() => navigate('/')}>
                        {t.vote.toHome}
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (isLoading || !session) {
        return (
            <div className="min-h-[80vh] grid place-items-center">
                <LoadingSpinner size="lg" text={t.vote.loading} />
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-[80vh] grid place-items-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center w-full"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full grid place-items-center mx-auto mb-4">
                        <span className="text-4xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {t.vote.completedTitle}
                    </h2>
                    <p className="text-gray-600 mb-6">{t.vote.completedBody}</p>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => navigate(`/results/${token}`)}
                    >
                        {t.vote.toResults}
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col p-4 py-6">
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4"
            >
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{session.vibe}</h1>
                <ProgressBar
                    current={currentIndex}
                    total={session.meals.length}
                    label={t.vote.progress}
                    className="max-w-md mx-auto"
                />
            </motion.div>

            <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-md aspect-[3/4]">
                    <AnimatePresence>
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
                                    <SwipeMealCard meal={meal} />
                                </SwipeCard>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-center max-w-md mx-auto w-full mt-4"
            >
                <Button
                    variant="danger"
                    onClick={swipeLeft}
                    disabled={!!votingMeal}
                    className="flex-1"
                >
                    <span className="text-2xl">👎</span>
                    <span>{t.vote.no}</span>
                </Button>
                <Button
                    variant="secondary"
                    onClick={swipeRight}
                    disabled={!!votingMeal}
                    className="flex-1"
                >
                    <span className="text-2xl">👍</span>
                    <span>{t.vote.yes}</span>
                </Button>
            </motion.div>

            <button
                type="button"
                onClick={() => navigate(`/results/${token}`)}
                className="block mx-auto mt-4 text-sm text-white/85 hover:text-white underline underline-offset-4 transition-colors"
            >
                {t.vote.skipToResults}
            </button>

            <p className="text-center text-white/70 text-xs mt-4">{t.vote.instructions}</p>
        </div>
    );
};

// Made with Bob
