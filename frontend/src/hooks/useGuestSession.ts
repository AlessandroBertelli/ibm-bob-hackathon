// Mints (or reuses) a guest token for a session so anonymous voters can call
// the cast_vote RPC without ever signing in.

import { useEffect, useState } from 'react';
import { mintGuest } from '../services/vote.service';
import { getGuestToken, setGuestToken } from '../utils/storage';

export const useGuestSession = (sessionId: string | undefined) => {
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        const cached = getGuestToken(sessionId);
        if (cached) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setToken(cached);
            return;
        }
        let cancelled = false;
        mintGuest(sessionId)
            .then((res) => {
                if (cancelled) return;
                setGuestToken(sessionId, res.guest_token);
                setToken(res.guest_token);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Error');
            });
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    return { token, error };
};

// Made with Bob
