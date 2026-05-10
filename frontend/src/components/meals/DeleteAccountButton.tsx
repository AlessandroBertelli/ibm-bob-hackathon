// "Account löschen" button + confirm modal. Shown at the bottom of the
// profile page. The actual delete cascades server-side: profile → sessions.
// Saved meals stay in the DB orphaned (ON DELETE SET NULL) per design.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { deleteAccount } from '../../services/account.service';
import { t } from '../../i18n/en';

export const DeleteAccountButton = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !busy) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, busy]);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await deleteAccount();
            await signOut();
            toast.success(t.account.deleted);
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Account delete failed:', err);
            toast.error(t.common.error);
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full text-center py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
            >
                {t.account.delete}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !busy && setOpen(false)}
                        className="fixed inset-0 bg-black/60 z-50 overflow-y-auto"
                    >
                        <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative"
                            >
                                <button
                                    type="button"
                                    aria-label={t.common.close}
                                    onClick={() => setOpen(false)}
                                    disabled={busy}
                                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-100 text-gray-700 grid place-items-center hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    ✕
                                </button>

                                <div className="p-6 pt-10 space-y-5">
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                            {t.account.confirmTitle}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {t.account.confirmBody}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={busy}
                                        aria-label={t.account.delete}
                                        className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white grid place-items-center shadow-md transition-colors"
                                    >
                                        {busy ? (
                                            <span className="text-sm">{t.common.loading}</span>
                                        ) : (
                                            <span className="text-2xl">🗑</span>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Made with Bob
