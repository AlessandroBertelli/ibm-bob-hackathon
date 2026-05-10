// Screen 4 — Live results. Real-time sorted ranking, no terminal "winner".
//
// Click any row to open the recipe modal. The bottom CTA is intentionally NOT
// "vote again" (the API silently dedups so re-votes are no-ops anyway, and the
// button confused users) — it sends signed-in users to their saved-meals
// profile, anonymous viewers to a sign-in prompt.

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LiveResultsRow } from '../components/meals/LiveResultsRow';
import { MealDetailModal } from '../components/meals/MealDetailModal';
import { HeartSaveButton } from '../components/meals/HeartSaveButton';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { useAuth } from '../hooks/useAuth';
import { useSavedMeals } from '../hooks/useSavedMeals';
import { setPostSignInRedirect } from '../utils/storage';
import type { SessionMeal } from '../types';
import { t } from '../i18n/en';

export const LiveResults = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { session, sortedMeals, isLoading, error } = useRealtimeSession(token);
    const { isAuthenticated } = useAuth();
    const { meals: savedMeals, refresh: refreshSaved } = useSavedMeals(isAuthenticated);
    const [openMeal, setOpenMeal] = useState<SessionMeal | null>(null);

    const savedTitles = useMemo(() => {
        const m = new Map<string, string>();
        for (const meal of savedMeals) m.set(meal.title, meal.id);
        return m;
    }, [savedMeals]);

    if (!token || error) {
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
                        {t.vote.notFoundTitle}
                    </h2>
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
                <LoadingSpinner size="lg" text={t.results.loading} />
            </div>
        );
    }

    const handleSignUp = () => {
        // Persist where the user is so we land them back here after auth.
        setPostSignInRedirect(window.location.pathname);
        navigate('/');
    };

    return (
        <div className="min-h-[80vh] p-4 py-8">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {t.results.title}
                    </h1>
                    <p className="text-white/90 text-base">{t.results.subtitle}</p>
                    <p className="text-white/70 text-sm mt-1">{session.vibe}</p>
                </motion.div>

                <div className="space-y-3">
                    <AnimatePresence>
                        {sortedMeals.map((meal, idx) => (
                            <LiveResultsRow
                                key={meal.id}
                                meal={meal}
                                rank={idx + 1}
                                onClick={() => setOpenMeal(meal)}
                                savedTitles={savedTitles}
                                onSaveChange={refreshSaved}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                <div className="mt-8 max-w-md mx-auto">
                    {isAuthenticated ? (
                        <Link
                            to="/profile/saved-meals"
                            className="block w-full text-center py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors"
                        >
                            {t.results.toProfile}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSignUp}
                            className="block w-full text-center py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors"
                        >
                            {t.results.signUpPrompt}
                        </button>
                    )}
                </div>

                <MealDetailModal
                    meal={openMeal}
                    isOpen={!!openMeal}
                    onClose={() => setOpenMeal(null)}
                    actions={
                        openMeal ? (
                            <HeartSaveButton
                                meal={openMeal}
                                savedTitles={savedTitles}
                                onChange={refreshSaved}
                            />
                        ) : null
                    }
                />
            </div>
        </div>
    );
};

// Made with Bob
