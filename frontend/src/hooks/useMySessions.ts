// Lists the host's own sessions for the "My Sessions" history block.

import { useCallback, useEffect, useState } from 'react';
import type { MySession } from '../types';
import { listMySessions } from '../services/session.service';

interface UseMySessionsReturn {
    sessions: MySession[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useMySessions = (enabled = true): UseMySessionsReturn => {
    const [sessions, setSessions] = useState<MySession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const list = await listMySessions();
            setSessions(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (enabled) refresh();
    }, [enabled, refresh]);

    return { sessions, isLoading, error, refresh };
};

// Made with Bob
