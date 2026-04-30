// Session management hook with real-time updates

import { useState, useEffect, useCallback } from 'react';
import type { Session, SessionStatus } from '../types';
import * as sessionService from '../services/session.service';
import * as voteService from '../services/vote.service';

interface UseSessionReturn {
    session: Session | null;
    isLoading: boolean;
    error: string | null;
    loadSession: (sessionId: string) => Promise<void>;
    loadSessionByToken: (token: string) => Promise<void>;
    updateStatus: (status: SessionStatus) => Promise<void>;
    regenerate: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

/**
 * Custom hook for session management with polling for real-time updates
 */
export const useSession = (sessionId?: string, enablePolling = false): UseSessionReturn => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load session by ID
     */
    const loadSession = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const sessionData = await sessionService.getSession(id);
            setSession(sessionData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
            setError(errorMessage);
            console.error('Failed to load session:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Load session by share token
     */
    const loadSessionByToken = useCallback(async (token: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const sessionData = await sessionService.getSessionByToken(token);
            setSession(sessionData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
            setError(errorMessage);
            console.error('Failed to load session by token:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Update session status
     */
    const updateStatus = useCallback(async (status: SessionStatus) => {
        if (!session) return;

        try {
            const updatedSession = await sessionService.updateSessionStatus(session.id, status);
            setSession(updatedSession);
        } catch (err) {
            console.error('Failed to update session status:', err);
            throw err;
        }
    }, [session]);

    /**
     * Regenerate meal options
     */
    const regenerate = useCallback(async () => {
        if (!session) return;

        setIsLoading(true);
        try {
            const updatedSession = await sessionService.regenerateMeals(session.id);
            setSession(updatedSession);
        } catch (err) {
            console.error('Failed to regenerate meals:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    /**
     * Refresh session data
     */
    const refreshSession = useCallback(async () => {
        if (!session) return;

        try {
            const sessionData = await sessionService.getSession(session.id);
            setSession(sessionData);
        } catch (err) {
            console.error('Failed to refresh session:', err);
        }
    }, [session]);

    /**
     * Auto-load session on mount if sessionId provided
     */
    useEffect(() => {
        if (sessionId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadSession(sessionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    /**
     * Poll for updates when generating or voting is active
     */
    useEffect(() => {
        if (!enablePolling || !session) {
            return;
        }

        // Poll during generating phase to detect when meals are ready
        if (session.status === 'generating') {
            const pollInterval = setInterval(async () => {
                try {
                    await refreshSession();
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 2000); // Poll every 2 seconds during generation

            return () => clearInterval(pollInterval);
        }

        // Poll during voting phase to check for winner
        if (session.status === 'voting') {
            const pollInterval = setInterval(async () => {
                try {
                    // Check voting progress
                    const progress = await voteService.getProgress(session.id);

                    // If winner is determined, refresh session to get updated status
                    if (progress.winnerId) {
                        await refreshSession();
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 3000); // Poll every 3 seconds during voting

            return () => clearInterval(pollInterval);
        }
    }, [enablePolling, session, refreshSession]);

    return {
        session,
        isLoading,
        error,
        loadSession,
        loadSessionByToken,
        updateStatus,
        regenerate,
        refreshSession,
    };
};

// Made with Bob
