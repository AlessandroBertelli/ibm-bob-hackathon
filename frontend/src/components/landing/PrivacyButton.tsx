// "Privatsphäre & Nutzung" button on Landing — opens a modal with the short
// hobbyist privacy + T&C copy. Closes via ✕ top-right or backdrop click.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../../i18n/en';

export const PrivacyButton = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <>
            <div className="text-center">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-sm text-white/80 hover:text-white underline underline-offset-4 transition-colors"
                >
                    {t.privacy.cta}
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/60 z-50 overflow-y-auto"
                    >
                        <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
                            <motion.div
                                initial={{ scale: 0.96, opacity: 0, y: 16 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.96, opacity: 0, y: 16 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative"
                            >
                                <button
                                    type="button"
                                    aria-label={t.common.close}
                                    onClick={() => setOpen(false)}
                                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-100 text-gray-700 grid place-items-center hover:bg-gray-200 transition-colors"
                                >
                                    ✕
                                </button>

                                <div className="p-6 sm:p-8 space-y-5">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {t.privacy.title}
                                    </h2>

                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                                            {t.privacy.privacyHeading}
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed text-sm">
                                            {t.privacy.privacyBody}
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                                            {t.privacy.termsHeading}
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                                            {t.privacy.termsBody}
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                                            {t.privacy.contactHeading}
                                        </h3>
                                        <p className="text-gray-700 text-sm">
                                            <a
                                                href="mailto:no-reply@atavola.ch"
                                                className="text-orange-600 hover:text-orange-700 underline underline-offset-2"
                                            >
                                                no-reply@atavola.ch
                                            </a>
                                        </p>
                                    </section>
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
