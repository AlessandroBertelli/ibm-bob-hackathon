// Screen 2 — Host review of the 4 generated cards. Clicking a card opens
// the detail modal. Clicking the share CTA opens the share sheet (no separate
// "Copy" button — the URL pill itself copies on tap).

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MealReviewCard } from '../components/meals/MealReviewCard';
import { MealDetailModal } from '../components/meals/MealDetailModal';
import { HeartSaveButton } from '../components/meals/HeartSaveButton';
import { getSession, regenerateSession } from '../services/session.service';
import { useAuth } from '../hooks/useAuth';
import { useSavedMeals } from '../hooks/useSavedMeals';
import { copyToClipboard, getShareUrl } from '../utils/helpers';
import type { SessionMeal, SessionWithMeals } from '../types';
import { t } from '../i18n/en';

export const SessionView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { meals: savedMeals, refresh: refreshSaved } = useSavedMeals(isAuthenticated);

    const [session, setSession] = useState<SessionWithMeals | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [busy, setBusy] = useState(false);
    const [openMeal, setOpenMeal] = useState<SessionMeal | null>(null);

    const canNativeShare =
        typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    /** title → saved-meal id, used by HeartSaveButton instances. */
    const savedTitles = useMemo(() => {
        const m = new Map<string, string>();
        for (const meal of savedMeals) m.set(meal.title, meal.id);
        return m;
    }, [savedMeals]);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        const load = async () => {
            try {
                const s = await getSession(id);
                if (!cancelled) setSession(s);
            } catch (err) {
                console.error('Failed to load session:', err);
                if (!cancelled) navigate('/create');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [id, navigate]);

    const shareUrl = session ? getShareUrl(session.share_token) : '';

    const handleCopy = async () => {
        if (!shareUrl) return;
        const ok = await copyToClipboard(shareUrl);
        if (ok) toast.success(t.session.share.copied);
        else toast.error(t.session.share.copyError);
    };

    const handleNativeShare = async () => {
        if (!shareUrl || !canNativeShare) return;
        try {
            await navigator.share({
                title: t.app.name,
                text: t.session.share.nativeShareText,
                url: shareUrl,
            });
        } catch (err) {
            // AbortError fires when the user dismisses the share sheet — ignore.
            if ((err as Error).name !== 'AbortError') {
                console.warn('Native share failed:', err);
                handleCopy();
            }
        }
    };

    const handleRegenerate = async () => {
        if (!session) return;
        setBusy(true);
        try {
            const updated = await regenerateSession(session.id);
            setSession(updated);
        } catch (err) {
            console.error('Regenerate failed:', err);
            toast.error(t.common.error);
        } finally {
            setBusy(false);
        }
    };

    if (isLoading || !session) {
        return (
            <div className="min-h-[80vh] grid place-items-center">
                <LoadingSpinner size="lg" text={t.session.loading} />
            </div>
        );
    }

    if (session.status === 'generating' || session.meals.length === 0) {
        return (
            <div className="min-h-[80vh] grid place-items-center p-4">
                <Card>
                    <LoadingSpinner size="lg" text={t.session.generating} />
                    <p className="text-gray-600 text-center mt-4">{t.session.generatingHint}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] p-4 py-8">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {t.session.title}
                    </h1>
                    <p className="text-white/90 text-lg">
                        {t.session.subtitle(session.vibe, session.headcount)}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {session.meals.map((meal) => (
                        <MealReviewCard
                            key={meal.id}
                            meal={meal}
                            onClick={() => setOpenMeal(meal)}
                            savedTitles={savedTitles}
                            onSaveChange={refreshSaved}
                        />
                    ))}
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="primary"
                            onClick={() => setShowShareModal(true)}
                            className="flex-1"
                        >
                            {t.session.createLink}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleRegenerate}
                            isLoading={busy}
                            className="flex-1"
                        >
                            {t.session.regenerate}
                        </Button>
                    </div>
                </div>

                {/* --- Share modal ------------------------------------------------ */}
                <AnimatePresence>
                    {showShareModal && !showQR && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-7 max-w-md w-full"
                            >
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {t.session.share.title}
                                </h3>
                                <p className="text-gray-600 mb-4">{t.session.share.description}</p>

                                <p className="text-xs text-gray-500 mb-1 text-center">
                                    {t.session.share.tapToCopy}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    aria-label={t.session.share.tapToCopy}
                                    className="w-full text-left bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl p-3 mb-4 break-all text-sm font-mono transition-colors cursor-pointer"
                                >
                                    {shareUrl}
                                </button>

                                <div className="flex flex-col gap-2">
                                    {canNativeShare && (
                                        <Button
                                            variant="primary"
                                            onClick={handleNativeShare}
                                            fullWidth
                                        >
                                            {t.session.share.shareNative}
                                        </Button>
                                    )}
                                    <Button
                                        variant={canNativeShare ? 'outline' : 'primary'}
                                        onClick={() => setShowQR(true)}
                                        fullWidth
                                    >
                                        {t.session.share.qr}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowShareModal(false)}
                                        fullWidth
                                    >
                                        {t.session.share.close}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- QR modal --------------------------------------------------- */}
                <AnimatePresence>
                    {showQR && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQR(false)}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-7 max-w-md w-full text-center"
                            >
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {t.session.share.qrTitle}
                                </h3>
                                <p className="text-gray-600 mb-5">{t.session.share.qrBody}</p>
                                <div className="bg-white p-4 rounded-2xl inline-block">
                                    <QRCodeSVG value={shareUrl} size={280} level="H" />
                                </div>
                                <div className="mt-6">
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setShowQR(false);
                                            setShowShareModal(false);
                                        }}
                                        fullWidth
                                    >
                                        {t.session.share.close}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Detail modal ----------------------------------------------- */}
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
