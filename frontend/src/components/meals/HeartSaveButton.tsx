// Heart button: saves a session_meal to the user's "My Food", or unsaves
// it if it's already there. The parent passes a `savedTitles` Map (title →
// saved-meal id) so the button starts in the correct state and knows which
// id to delete on unsave.
//
// If the user is anonymous, opens an inline auth dialog that triggers a
// magic link with `redirect_to` set so the user lands back where they started.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import {
    createSavedMeal,
    deleteSavedMeal,
} from '../../services/savedMeals.service';
import { setPostSignInRedirect } from '../../utils/storage';
import { validateEmail } from '../../utils/helpers';
import { t } from '../../i18n/en';
import type { SessionMeal } from '../../types';
import { isMockMode } from '../../lib/supabase';

interface Props {
    meal: SessionMeal;
    compact?: boolean;
    /** title → saved-meal id. Undefined while the parent is still loading. */
    savedTitles?: Map<string, string>;
    /** Called after a successful save / unsave so the parent can refetch. */
    onChange?: () => void;
}

export const HeartSaveButton = ({ meal, compact, savedTitles, onChange }: Props) => {
    const { isAuthenticated, signInWithEmail, signInMock } = useAuth();
    const [busy, setBusy] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [linkSent, setLinkSent] = useState(false);

    // Sync prefill state from the parent's savedTitles map. setState here is
    // intentional — we're mirroring an external prop into local state so the
    // user can also toggle locally between server fetches.
    useEffect(() => {
        if (savedTitles) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSavedId(savedTitles.get(meal.title) ?? null);
        }
    }, [savedTitles, meal.title]);

    const isSaved = savedId !== null;
    const buttonSize = compact ? 'w-9 h-9' : 'w-11 h-11';
    const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';

    const performSave = async () => {
        const created = await createSavedMeal({ source_session_meal_id: meal.id });
        setSavedId(created.id);
        toast.success(t.heart.saved);
        onChange?.();
    };

    const performUnsave = async () => {
        if (!savedId) return;
        await deleteSavedMeal(savedId);
        setSavedId(null);
        toast.success(t.heart.unsaved);
        onChange?.();
    };

    const handleClick = async (e: React.MouseEvent) => {
        // Stop the click bubbling — heart sits inside clickable cards / rows.
        e.stopPropagation();

        if (!isAuthenticated) {
            setDialogOpen(true);
            return;
        }
        if (busy) return;

        setBusy(true);
        try {
            if (isSaved) {
                await performUnsave();
            } else {
                await performSave();
            }
        } catch (err) {
            console.error('Heart toggle failed:', err);
            toast.error(t.common.error);
        } finally {
            setBusy(false);
        }
    };

    const submitMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        if (!validateEmail(email)) {
            setEmailError(t.landing.invalidEmail);
            return;
        }
        setBusy(true);
        try {
            if (isMockMode) {
                signInMock(email);
                setDialogOpen(false);
                await performSave();
            } else {
                setPostSignInRedirect(window.location.pathname + window.location.search);
                await signInWithEmail(email, window.location.pathname + window.location.search);
                setLinkSent(true);
            }
        } catch (err) {
            console.error('Sign-in failed:', err);
            toast.error(t.landing.sendError);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                aria-label={isSaved ? t.heart.saved : t.heart.save}
                onClick={handleClick}
                disabled={busy}
                className={`${buttonSize} rounded-full grid place-items-center bg-white/95 text-red-500 shadow-md transition-transform hover:scale-110 disabled:opacity-50`}
            >
                <svg
                    className={iconSize}
                    viewBox="0 0 24 24"
                    fill={isSaved ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            </button>

            <AnimatePresence>
                {dialogOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => !linkSent && setDialogOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {t.heart.signInTitle}
                            </h3>
                            {linkSent ? (
                                <>
                                    <p className="text-gray-600 mb-4">{t.heart.sentBody}</p>
                                    <button
                                        onClick={() => setDialogOpen(false)}
                                        className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                                    >
                                        {t.common.close}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-4">{t.heart.signInBody}</p>
                                    <form onSubmit={submitMagicLink} className="space-y-3">
                                        <input
                                            type="email"
                                            placeholder={t.landing.emailPlaceholder}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={busy}
                                            autoFocus
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                                        />
                                        {emailError && (
                                            <p className="text-sm text-red-600">{emailError}</p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={busy}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-md hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                                        >
                                            {t.heart.sendLink}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDialogOpen(false)}
                                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            {t.common.cancel}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Made with Bob
