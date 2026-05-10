// Tech-stack & live-services status block on Landing.
//
// The "Live services" rows have a coloured dot driven by the most recent
// real-world outcome (see /api/status). The "Stack" rows are static — no
// dot, just attribution.

import { useEffect, useState } from 'react';
import { fetchStatus, type ServiceOutcome, type ServiceStatus } from '../../services/status.service';
import { t } from '../../i18n/en';

const STACK_LINES: string[] = [
    'Supabase — Auth, Postgres, Realtime, Storage',
    'Resend — magic-link delivery (via Supabase SMTP)',
    'React 19 + Vite + Tailwind v4 + Framer Motion + dnd-kit',
];

function dotClass(outcome: ServiceOutcome): string {
    switch (outcome) {
        case 'ok':
            return 'bg-emerald-500';
        case 'rate_limited':
            return 'bg-amber-400';
        case 'error':
            return 'bg-red-500';
    }
}

function dotTitle(outcome: ServiceOutcome): string {
    switch (outcome) {
        case 'ok':
            return t.landing.status.ok;
        case 'rate_limited':
            return t.landing.status.rateLimited;
        case 'error':
            return t.landing.status.error;
    }
}

export const TechStackStatus = () => {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchStatus()
            .then((s) => {
                if (!cancelled) setServices(s);
            })
            .catch((e: Error) => {
                if (!cancelled) setError(e.message);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section>
            {/* Heading lives inside the card (matches the Contributors
                block) so the two footer cards read as paired siblings. */}
            <div className="bg-white/95 rounded-2xl shadow-lg p-5 text-sm text-gray-700 space-y-4 max-w-md mx-auto">
                <h2 className="text-xl font-bold text-gray-900 text-center">
                    {t.landing.tech.heading}
                </h2>
                <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                        {t.landing.tech.live}
                    </p>
                    {error ? (
                        <p className="text-xs text-red-600">{t.landing.tech.statusError}</p>
                    ) : services.length === 0 ? (
                        <p className="text-xs text-gray-400">{t.landing.tech.loading}</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {services.map((s) => (
                                <li key={s.key} className="flex items-start gap-2">
                                    <span
                                        title={dotTitle(s.outcome)}
                                        aria-label={dotTitle(s.outcome)}
                                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotClass(s.outcome)}`}
                                    />
                                    <span>{s.label}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                        {t.landing.tech.stack}
                    </p>
                    <ul className="space-y-1.5">
                        {STACK_LINES.map((line) => (
                            <li key={line} className="flex items-start gap-2">
                                <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-gray-300" />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

// Made with Bob
