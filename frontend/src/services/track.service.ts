// Track service — fire-and-forget anonymous visit / login beacons.
// Failures are intentionally swallowed; tracking must never block UX.

import api from './api';
import { getOrCreateFingerprint } from '../utils/storage';

export const trackVisit = async (): Promise<void> => {
    try {
        await api.post('/track/visit', { fingerprint: getOrCreateFingerprint() });
    } catch {
        /* swallow */
    }
};

export const trackLogin = async (): Promise<void> => {
    try {
        await api.post('/track/login');
    } catch {
        /* swallow */
    }
};

// Made with Bob
