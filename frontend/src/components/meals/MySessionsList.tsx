// "My Sessions" history block on the profile page.
//
// Collapsed by default — only the most recent session is shown plus a big
// orange "New session" CTA. Tap the header to expand and see the full list
// (no New session button in expanded view — they're in browse mode).
//
// Sessions are auto-purged after 30 days by the cron job in
// 0004_session_lifecycle.sql.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { MySession } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { t } from '../../i18n/en';

interface Props {
    sessions: MySession[];
    isLoading: boolean;
}

function relativeTime(iso: string, now: number): string {
    const then = new Date(iso).getTime();
    const diffSecs = Math.max(0, Math.floor((now - then) / 1000));
    if (diffSecs < 60) return t.history.relativeJustNow;
    const mins = Math.floor(diffSecs / 60);
    if (mins < 60) return t.history.relativeMinutes(mins);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t.history.relativeHours(hours);
    const days = Math.floor(hours / 24);
    return t.history.relativeDays(days);
}

interface RowProps {
    session: MySession;
    now: number;
}

const SessionRow = ({ session, now }: RowProps) => (
    <Link
        to={`/results/${session.share_token}`}
        className="block bg-white rounded-2xl border border-gray-100 px-4 py-3 hover:border-orange-300 hover:shadow-md transition-all"
    >
        <p className="font-semibold text-gray-900 truncate">{session.vibe}</p>
        <p className="text-xs text-gray-500 mt-0.5">
            {relativeTime(session.created_at, now)} · {t.history.voters(session.voter_count)}
        </p>
    </Link>
);

const NewSessionButton = () => (
    <Link
        to="/create"
        className="block w-full text-center py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
    >
        {t.history.newSession}
    </Link>
);

export const MySessionsList = ({ sessions, isLoading }: Props) => {
    const [expanded, setExpanded] = useState(false);

    // Wall-clock for relative-time display. Per-render is fine — same
    // pattern used elsewhere (SECURITY.md note about React 19 purity rule).
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    const canExpand = sessions.length > 1;
    const displayed = expanded ? sessions : sessions.slice(0, 1);
    const hint = !canExpand
        ? null
        : expanded
          ? t.history.tapToCollapse
          : t.history.tapToExpand;

    return (
        <>
            {/* Header — clickable when there's something to expand */}
            <button
                type="button"
                onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
                disabled={!canExpand}
                aria-expanded={expanded}
                className="w-full flex items-baseline justify-between gap-3 mb-3 text-left disabled:cursor-default group"
            >
                <h2 className="text-lg font-bold text-gray-900">{t.history.title}</h2>
                {hint && (
                    <span className="text-xs text-gray-500 group-hover:text-orange-500 transition-colors">
                        {hint}
                    </span>
                )}
            </button>

            {isLoading ? (
                <div className="py-6">
                    <LoadingSpinner size="sm" />
                </div>
            ) : sessions.length === 0 ? (
                <>
                    <p className="text-sm text-gray-500 text-center py-6">{t.history.empty}</p>
                    <NewSessionButton />
                </>
            ) : (
                <>
                    <ul className="space-y-2">
                        {displayed.map((s) => (
                            <li key={s.id}>
                                <SessionRow session={s} now={now} />
                            </li>
                        ))}
                    </ul>

                    {/* New session CTA only in collapsed view. Expanded view
                        is for browsing history; create-session lives elsewhere. */}
                    {!expanded && (
                        <div className="mt-3">
                            <NewSessionButton />
                        </div>
                    )}

                    <p className="text-[11px] text-gray-400 text-center mt-4 italic">
                        {t.history.expiryNote}
                    </p>
                </>
            )}
        </>
    );
};

// Made with Bob
