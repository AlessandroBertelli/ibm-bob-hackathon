// Screen 1 — Host setup form, including the "My Food" pre-selection table.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { MealsPickerTable } from '../components/meals/MealsPickerTable';
import { useAuth } from '../hooks/useAuth';
import { useSavedMeals } from '../hooks/useSavedMeals';
import { createSession } from '../services/session.service';
import { t } from '../i18n/en';

export const CreateSession = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { meals: savedMeals, isLoading: savedLoading } = useSavedMeals(isAuthenticated);

    const [vibe, setVibe] = useState('');
    const [headcount, setHeadcount] = useState(4);
    const [vegan, setVegan] = useState(false);
    const [glutenFree, setGlutenFree] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ vibe?: string; headcount?: string }>({});
    const [busy, setBusy] = useState(false);

    if (!authLoading && !isAuthenticated) {
        navigate('/', { replace: true });
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const next: typeof errors = {};
        if (vibe.trim().length < 3) next.vibe = t.create.vibeError;
        if (headcount < 2 || headcount > 20) next.headcount = t.create.headcountError;
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        const dietary: string[] = [];
        if (vegan) dietary.push('vegan');
        if (glutenFree) dietary.push('gluten-free');

        setBusy(true);
        try {
            const session = await createSession({
                vibe: vibe.trim(),
                headcount,
                dietary,
                selected_saved_meal_ids: selectedIds,
            });
            navigate(`/session/${session.id}`);
        } catch (err) {
            console.error('Create session failed:', err);
            toast.error(t.create.createError);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-start justify-center p-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {t.create.title}
                    </h1>
                    <p className="text-white text-lg opacity-90">{t.create.subtitle}</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Input
                                label={t.create.vibeLabel}
                                placeholder={t.create.vibePlaceholder}
                                value={vibe}
                                onChange={(e) => setVibe(e.target.value)}
                                error={errors.vibe}
                                fullWidth
                                disabled={busy}
                            />
                        </div>

                        <div>
                            <Input
                                label={t.create.headcountLabel}
                                type="number"
                                min={2}
                                max={20}
                                value={String(headcount)}
                                onChange={(e) => setHeadcount(parseInt(e.target.value, 10) || 2)}
                                error={errors.headcount}
                                fullWidth
                                disabled={busy}
                            />
                            <p className="text-sm text-gray-500 mt-1">{t.create.headcountHelper}</p>
                        </div>

                        <div>
                            <p className="block text-sm font-semibold text-gray-700 mb-3">
                                {t.create.dietaryTitle}
                            </p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={vegan}
                                        onChange={(e) => setVegan(e.target.checked)}
                                        className="w-5 h-5 accent-blue-600"
                                        disabled={busy}
                                    />
                                    <span className="text-gray-700">{t.create.vegan}</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={glutenFree}
                                        onChange={(e) => setGlutenFree(e.target.checked)}
                                        className="w-5 h-5 accent-blue-600"
                                        disabled={busy}
                                    />
                                    <span className="text-gray-700">{t.create.glutenFree}</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <p className="block text-sm font-semibold text-gray-700 mb-1">
                                {t.create.myFoodTitle}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">{t.create.myFoodHint}</p>
                            {savedLoading ? (
                                <p className="text-sm text-gray-500">{t.common.loading}</p>
                            ) : (
                                <MealsPickerTable
                                    variant="picker"
                                    meals={savedMeals}
                                    selectedIds={selectedIds}
                                    onSelectionChange={setSelectedIds}
                                />
                            )}
                        </div>

                        <Button type="submit" variant="primary" fullWidth isLoading={busy}>
                            {busy ? t.create.creating : t.create.submit}
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

// Made with Bob
