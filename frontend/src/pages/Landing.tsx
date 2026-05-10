// Landing / sign-in page.
//
// Top of the page hosts the logo (the global Header is hidden on `/` —
// AppLayout handles the route check). The sign-in form sits in a card
// directly under it, then three additional sections: contributors, tech
// stack & live status, and the privacy / T&C button.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/helpers';
import { isMockMode } from '../lib/supabase';
import { Contributors } from '../components/landing/Contributors';
import { TechStackStatus } from '../components/landing/TechStackStatus';
import { PrivacyButton } from '../components/landing/PrivacyButton';
import { t } from '../i18n/en';

export const Landing = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, signInWithEmail, signInMock } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const [logoBroken, setLogoBroken] = useState(false);

    // If already signed in, jump straight to the host flow.
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/create', { replace: true });
        }
    }, [isLoading, isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateEmail(email)) {
            setError(t.landing.invalidEmail);
            return;
        }
        setBusy(true);
        try {
            if (isMockMode) {
                signInMock(email);
                navigate('/create');
            } else {
                await signInWithEmail(email, '/create');
                setSent(true);
            }
        } catch (err) {
            console.error('Sign-in failed:', err);
            toast.error(t.landing.sendError);
        } finally {
            setBusy(false);
        }
    };

    // Three pillars rendered horizontally inside the sign-in card. Stay
    // visible in the success state too (below the "Check your inbox" block)
    // because they're the page's actual onboarding content — the form is
    // just the entry point.
    const pillars = [
        t.landing.pillars.vibe,
        t.landing.pillars.swipe,
        t.landing.pillars.host,
    ] as const;

    return (
        <div className="min-h-screen p-4 py-8 sm:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md mx-auto space-y-8"
            >
                {/* Logo — capped width so it stays iconic on tablets/desktop
                    instead of stretching to the full max-w-md card width. */}
                <div className="space-y-3">
                    {!logoBroken ? (
                        <img
                            src="/logo.png"
                            alt={t.app.name}
                            onError={() => setLogoBroken(true)}
                            className="w-full max-w-xs h-auto mx-auto select-none drop-shadow-lg"
                            draggable={false}
                        />
                    ) : (
                        <h1 className="text-5xl font-bold text-orange-500 text-center drop-shadow-lg">
                            {t.app.name}
                        </h1>
                    )}

                    {/* Tagline — warm gradient so it carries brand colour
                        above the orange CTA inside the card. Bright stops
                        keep it legible against the dark page background. */}
                    <p className="text-center text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-300 via-amber-200 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                        {t.landing.tagline}
                    </p>
                </div>

                {/* Sign-in card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl shadow-2xl p-7 sm:p-8 space-y-6"
                >
                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="email"
                                label={t.landing.emailLabel}
                                placeholder={t.landing.emailPlaceholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={error}
                                fullWidth
                                disabled={busy}
                                autoComplete="email"
                            />
                            <Button type="submit" variant="primary" fullWidth isLoading={busy}>
                                {t.landing.sendLink}
                            </Button>
                            {isMockMode && (
                                <p className="text-xs text-gray-500 text-center">
                                    {t.landing.mockHint}
                                </p>
                            )}
                        </form>
                    ) : (
                        // Slim, on-brand success state. Replaces the earlier
                        // green-circle ✉️ block which felt foreign next to
                        // the orange CTA. Single line of copy + retry button
                        // → mirrors the original form's vertical rhythm so
                        // the card height barely changes between states.
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                <span
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-base shadow-sm"
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {t.landing.sentTitle}
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                {t.landing.sentBody} <strong>{email}</strong>
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSent(false);
                                    setEmail('');
                                }}
                                fullWidth
                            >
                                {t.landing.sentRetry}
                            </Button>
                        </div>
                    )}

                    {/* Subtle divider — separates the action from the
                        onboarding pillars without shouting. */}
                    <div className="border-t border-gray-200" />

                    {/* Three vertical pillar rows. Each row stacks emoji →
                        title → body so the copy can breathe at full width
                        instead of being squeezed into a 1/3-column. */}
                    <ul className="space-y-5 text-center">
                        {pillars.map((p) => (
                            <li key={p.title} className="space-y-1">
                                <div className="text-3xl sm:text-4xl" aria-hidden="true">
                                    {p.emoji}
                                </div>
                                <p className="text-base font-bold text-gray-900 leading-tight">
                                    {p.title}
                                </p>
                                <p className="text-sm text-gray-500 leading-snug">
                                    {p.body}
                                </p>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Footer block 1: contributors */}
                <Contributors />

                {/* Footer block 2: tech stack + live status */}
                <TechStackStatus />

                {/* Privacy + T&C affordance, below everything else */}
                <PrivacyButton />

                {/* Tiny bottom credit. Convention, costs nothing. */}
                <p className="text-center text-[11px] text-white/40 pt-1">
                    © atavola 2026 · MIT
                </p>
            </motion.div>
        </div>
    );
};

// Made with Bob
