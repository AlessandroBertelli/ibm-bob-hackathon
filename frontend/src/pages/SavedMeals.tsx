// Profile page — "My Food" management plus the "My Sessions" history.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MealsPickerTable } from '../components/meals/MealsPickerTable';
import { MealDetailModal } from '../components/meals/MealDetailModal';
import { MySessionsList } from '../components/meals/MySessionsList';
import { DeleteAccountButton } from '../components/meals/DeleteAccountButton';
import { useAuth } from '../hooks/useAuth';
import { useSavedMeals } from '../hooks/useSavedMeals';
import { useMySessions } from '../hooks/useMySessions';
import type { SavedMeal } from '../types';
import { t } from '../i18n/en';

export const SavedMeals = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { meals, isLoading, reorder, remove } = useSavedMeals(isAuthenticated);
    const { sessions, isLoading: sessionsLoading } = useMySessions(isAuthenticated);
    const [openMeal, setOpenMeal] = useState<SavedMeal | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate('/', { replace: true });
    }, [authLoading, isAuthenticated, navigate]);

    return (
        <div className="min-h-[80vh] p-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {t.myFood.title}
                    </h1>
                    <p className="text-white/85">{t.myFood.subtitle}</p>
                </motion.div>

                {/* Voting history. The list owns its own header / collapse. */}
                <section className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-5">
                    <MySessionsList sessions={sessions} isLoading={sessionsLoading} />
                </section>

                {/* Saved meals */}
                <section className="bg-white/95 backdrop-blur rounded-3xl shadow-xl p-5">
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                        <h2 className="text-lg font-bold text-gray-900">{t.nav.myFood}</h2>
                        <p className="text-xs text-gray-500">{t.myFood.manageHint}</p>
                    </div>
                    {isLoading ? (
                        <div className="py-10">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : (
                        <MealsPickerTable
                            variant="manage"
                            meals={meals}
                            onReorder={reorder}
                            onDelete={remove}
                            onRowClick={(m) => setOpenMeal(m)}
                        />
                    )}
                </section>

                {/* Detail modal for tapped Mein-Food rows. No actions slot —
                    these meals are already saved; the swipe-to-delete in the
                    list handles removal. */}
                <MealDetailModal
                    meal={openMeal}
                    isOpen={!!openMeal}
                    onClose={() => setOpenMeal(null)}
                />

                {/* Account deletion lives at the very bottom — destructive
                    actions go below normal use. */}
                <div className="pt-4">
                    <DeleteAccountButton />
                </div>
            </div>
        </div>
    );
};

// Made with Bob
