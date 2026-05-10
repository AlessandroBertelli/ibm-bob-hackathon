// Vote service — guest minting + vote casting.

import api from './api';
import type { VoteValue } from '../types';

export const mintGuest = async (sessionId: string): Promise<{ guest_token: string; guest_id: string }> => {
    const { data } = await api.post<{ guest_token: string; guest_id: string }>('/votes/guest', {
        session_id: sessionId,
    });
    return data;
};

export const castVote = async (
    guestToken: string,
    sessionMealId: string,
    value: VoteValue
): Promise<void> => {
    await api.post('/votes', {
        guest_token: guestToken,
        session_meal_id: sessionMealId,
        value,
    });
};

// Made with Bob
