// Subscribes to Supabase Realtime updates for a single session and keeps the
// `meals` array fresh as votes come in.

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isMockMode } from '../lib/supabase';
import type { SessionMeal, SessionWithMeals } from '../types';
import { getSessionByToken } from '../services/session.service';

interface UseRealtimeSessionReturn {
    session: SessionWithMeals | null;
    sortedMeals: SessionMeal[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const MOCK_POLL_MS = 2_500;

function sortByLikes(meals: SessionMeal[]): SessionMeal[] {
    return [...meals].sort((a, b) => {
        if (b.yes_count !== a.yes_count) return b.yes_count - a.yes_count;
        if (a.no_count !== b.no_count) return a.no_count - b.no_count;
        return a.position - b.position;
    });
}

export const useRealtimeSession = (token: string | undefined): UseRealtimeSessionReturn => {
    const [session, setSession] = useState<SessionWithMeals | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!token);
    const [error, setError] = useState<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        let channel: RealtimeChannel | null = null;
        let pollId: ReturnType<typeof setInterval> | null = null;

        const load = async () => {
            try {
                const fresh = await getSessionByToken(token);
                if (cancelled) return;
                setSession(fresh);
                sessionIdRef.current = fresh.id;
                setError(null);
            } catch (err) {
                if (cancelled) return;
                const msg = err instanceof Error ? err.message : 'Failed to load';
                setError(msg);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load().then(() => {
            if (cancelled || !sessionIdRef.current) return;

            if (isMockMode) {
                // No Supabase Realtime in mock mode — fall back to polling.
                pollId = setInterval(load, MOCK_POLL_MS);
                return;
            }

            const sid = sessionIdRef.current;
            channel = supabase
                .channel(`session:${sid}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'session_meals',
                        filter: `session_id=eq.${sid}`,
                    },
                    (payload) => {
                        const newRow = payload.new as SessionMeal | undefined;
                        if (!newRow) return;
                        setSession((current) => {
                            if (!current) return current;
                            const meals = current.meals.map((m) =>
                                m.id === newRow.id ? { ...m, ...newRow } : m
                            );
                            return { ...current, meals };
                        });
                    }
                )
                .subscribe();
        });

        return () => {
            cancelled = true;
            if (channel) supabase.removeChannel(channel);
            if (pollId) clearInterval(pollId);
        };
    }, [token]);

    const sortedMeals = session ? sortByLikes(session.meals) : [];

    return { session, sortedMeals, isLoading, error, refresh: async () => {} };
};

// Made with Bob
