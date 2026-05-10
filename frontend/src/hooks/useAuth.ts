// Auth hook — wraps Supabase Auth (or the mock-mode token).
//
// Cross-instance reactivity:
//   • Real auth: `supabase.auth.onAuthStateChange` fires for every instance.
//   • Mock auth: we don't go through Supabase, so we broadcast a window event
//     when signInMock / signOut runs and every useAuth instance re-reads from
//     localStorage. Without this the Header keeps showing "Anmelden" until
//     the next page refresh.

import { useCallback, useEffect, useState, useRef } from 'react';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../types';
import { clearMockToken, getMockToken, setMockToken } from '../utils/storage';
import { trackLogin } from '../services/track.service';

const AUTH_EVENT = 'bm:auth-changed';

function broadcastAuthChange() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_EVENT));
    }
}

interface UseAuthReturn {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signInWithEmail: (email: string, redirectTo?: string) => Promise<void>;
    signOut: () => Promise<void>;
    /** Mock-mode bypass; no-op when real Supabase is configured. */
    signInMock: (email: string) => void;
}

function userFromSession(session: SupabaseSession | null): AuthUser | null {
    if (!session?.user) return null;
    return { id: session.user.id, email: session.user.email ?? '' };
}

function userFromMockToken(token: string | null): AuthUser | null {
    if (!token || !token.startsWith('mock:')) return null;
    const email = token.slice(5).trim();
    if (!email) return null;
    // Match the deterministic-id derivation in mock-supabase.service.ts so the
    // frontend display matches what the backend will see.
    return { id: 'mock-' + email, email };
}

export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const trackedLogin = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const refresh = async () => {
            const mock = getMockToken();
            if (mock) {
                if (!cancelled) {
                    setUser(userFromMockToken(mock));
                    setIsLoading(false);
                }
                return;
            }
            const { data } = await supabase.auth.getSession();
            if (!cancelled) {
                setUser(userFromSession(data.session));
                setIsLoading(false);
            }
        };

        refresh();

        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            // Don't override the mock-mode user.
            if (getMockToken()) return;
            setUser(userFromSession(session));
        });

        // Cross-instance updates for mock-mode sign-in / sign-out.
        const onAuthChange = () => { refresh(); };
        window.addEventListener(AUTH_EVENT, onAuthChange);

        return () => {
            cancelled = true;
            sub.subscription.unsubscribe();
            window.removeEventListener(AUTH_EVENT, onAuthChange);
        };
    }, []);

    const signInWithEmail = useCallback(async (email: string, redirectTo?: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo:
                    `${window.location.origin}/auth/verify` +
                    (redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''),
            },
        });
        if (error) throw error;
    }, []);

    const signOut = useCallback(async () => {
        clearMockToken();
        await supabase.auth.signOut();
        setUser(null);
        broadcastAuthChange();
    }, []);

    const signInMock = useCallback((email: string) => {
        setMockToken(email);
        setUser(userFromMockToken(`mock:${email}`));
        broadcastAuthChange();
        // Mock mode never fires Supabase's SIGNED_IN event, so track manually.
        void trackLogin();
    }, []);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithEmail,
        signOut,
        signInMock,
    };
};

// Made with Bob
