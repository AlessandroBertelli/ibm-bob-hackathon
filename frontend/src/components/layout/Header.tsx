// Sticky transparent header. atavola logo on the LEFT (image, transparent
// background), profile dropdown / sign-in link on the right.
//
// The logo file is expected at frontend/public/logo.png. If it's missing the
// component falls back to a text wordmark so the app still ships.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../i18n/en';

const LOGO_SRC = '/logo.png';

export const Header = () => {
    const { user, isAuthenticated, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const [logoFailed, setLogoFailed] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const initial = (user?.email?.[0] ?? '?').toUpperCase();

    return (
        <header className="sticky top-0 z-50 bg-transparent">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link
                    to="/"
                    className="flex items-center gap-2 group"
                    aria-label={t.app.name}
                >
                    {!logoFailed ? (
                        <img
                            src={LOGO_SRC}
                            alt={t.app.name}
                            onError={() => setLogoFailed(true)}
                            className="h-9 sm:h-10 w-auto select-none drop-shadow-md group-hover:scale-[1.02] transition-transform"
                            draggable={false}
                        />
                    ) : (
                        <span className="font-bold text-xl text-orange-500 tracking-tight drop-shadow">
                            {t.app.name}
                        </span>
                    )}
                </Link>

                <div className="relative" ref={ref}>
                    {isAuthenticated ? (
                        <>
                            <button
                                aria-label={t.nav.openMenu}
                                onClick={() => setOpen((v) => !v)}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-semibold flex items-center justify-center shadow-md hover:scale-105 transition"
                            >
                                {initial}
                            </button>
                            <AnimatePresence>
                                {open && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                                    >
                                        <div className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100 truncate">
                                            {user?.email}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setOpen(false);
                                                navigate('/profile/saved-meals');
                                            }}
                                            className="block w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-orange-50"
                                        >
                                            {t.nav.myFood}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setOpen(false);
                                                await signOut();
                                                navigate('/');
                                            }}
                                            className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            {t.nav.signOut}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <Link
                            to="/"
                            className="text-sm font-semibold text-orange-500 hover:text-orange-600 drop-shadow"
                        >
                            {t.nav.signIn}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

// Made with Bob
