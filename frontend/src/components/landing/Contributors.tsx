// "Made with ❤ & 🍕 @ IBM Bobathon Zürich, 30 April '26 by:" + 3 cards.
// Each card: square photo (or a gradient placeholder with the initial when
// no photo is available yet), name, and a LinkedIn link below. Links open
// in a new tab with rel="noopener noreferrer".

import { useState } from 'react';
import { motion } from 'framer-motion';
import { t } from '../../i18n/en';

interface Contributor {
    name: string;
    /** Full LinkedIn URL or null while we don't have one yet. */
    linkedin: string | null;
    /** Path to a portrait under /public, or null to fall back to the gradient. */
    photo: string | null;
    /** Tailwind gradient pair for the placeholder portrait. */
    gradient: string;
}

const CONTRIBUTORS: Contributor[] = [
    {
        name: 'Alessandro',
        linkedin: 'https://www.linkedin.com/in/alessandro-bertelli',
        photo: '/alessandro.jpeg',
        gradient: 'from-orange-400 to-rose-500',
    },
    {
        name: 'Marco',
        linkedin: 'https://www.linkedin.com/in/marco-prosperi-05453515a',
        photo: '/marco.jpeg',
        gradient: 'from-amber-400 to-orange-500',
    },
    {
        name: 'Philipp',
        linkedin: 'https://linkedin.com/in/philipp-roehner',
        photo: '/philipp.png',
        gradient: 'from-rose-500 to-red-600',
    },
];

const LinkedInIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
    >
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.91 1.65-1.86 3.39-1.86 3.62 0 4.29 2.38 4.29 5.49v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM3.56 20.45h3.56V9H3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
);

interface PortraitProps {
    contributor: Contributor;
}

const Portrait = ({ contributor }: PortraitProps) => {
    const [photoFailed, setPhotoFailed] = useState(false);
    const showPhoto = !!contributor.photo && !photoFailed;
    return showPhoto ? (
        <img
            src={contributor.photo!}
            alt={contributor.name}
            onError={() => setPhotoFailed(true)}
            className="aspect-square w-full object-cover"
            draggable={false}
        />
    ) : (
        <div
            className={`aspect-square w-full bg-gradient-to-br ${contributor.gradient} grid place-items-center text-white font-bold text-2xl sm:text-3xl`}
            aria-hidden="true"
        >
            {contributor.name[0]}
        </div>
    );
};

export const Contributors = () => {
    return (
        <section>
            {/* Single card holds heading, subheading, and the three
                contributors. Each contributor gets its own row with a big
                square portrait on top and the name + LinkedIn link below —
                same shape as the original three-column grid, just stacked
                so each person owns the full card width. */}
            <div className="bg-white/95 rounded-2xl shadow-lg p-5 max-w-md mx-auto text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {t.landing.builtBy.heading}
                </h2>
                <p className="text-xs text-gray-500 mb-5">
                    {t.landing.builtBy.subheading}
                </p>

                <ul className="space-y-4">
                    {CONTRIBUTORS.map((c) => (
                        <motion.li
                            key={c.name}
                            whileHover={{ y: -2 }}
                            className="flex flex-col items-center bg-gray-50 rounded-2xl py-5 px-3"
                        >
                            <div className="w-44 sm:w-48 rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm mb-3">
                                <Portrait contributor={c} />
                            </div>
                            {c.linkedin ? (
                                <a
                                    href={c.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-gray-900 hover:text-orange-600 font-semibold text-base transition-colors"
                                >
                                    <LinkedInIcon className="w-4 h-4" />
                                    <span>{c.name}</span>
                                </a>
                            ) : (
                                <span
                                    className="flex items-center justify-center gap-2 text-gray-400 font-semibold text-base cursor-default"
                                    title={t.landing.builtBy.noLinkYet}
                                >
                                    <LinkedInIcon className="w-4 h-4 opacity-60" />
                                    <span>{c.name}</span>
                                </span>
                            )}
                        </motion.li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

// Made with Bob
