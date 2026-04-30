// Voting service for meal selection

import api from './api';
import type { VotingProgress, VotingStatus, WinnerResponse, VoteType, Meal } from '../types';

// Backend winner response structure
interface BackendWinnerResponse {
    success: boolean;
    winner: {
        meal_id: string;
        meal: Meal;
        vote_percentage: number;
        yes_votes: number;
        total_votes: number;
    } | null;
}

// Track in-flight vote requests to prevent duplicates
const inFlightVotes = new Set<string>();

/**
 * Submit a vote for a meal
 */
export const submitVote = async (
    sessionId: string,
    guestId: string,
    mealId: string,
    voteType: VoteType
): Promise<void> => {
    // Create unique key for this vote to prevent duplicates
    const voteKey = `${sessionId}-${guestId}-${mealId}`;

    // If this vote is already in progress, skip it
    if (inFlightVotes.has(voteKey)) {
        console.log('Vote already in progress, skipping duplicate');
        return;
    }

    try {
        inFlightVotes.add(voteKey);

        // Backend expects snake_case properties
        const voteData = {
            session_id: sessionId,
            guest_id: guestId,
            meal_id: mealId,
            vote_type: voteType,
        };

        await api.post('/votes', voteData);
    } finally {
        // Remove from in-flight set after a short delay to handle rapid clicks
        setTimeout(() => {
            inFlightVotes.delete(voteKey);
        }, 500);
    }
};

/**
 * Get voting progress for a session
 */
export const getProgress = async (sessionId: string): Promise<VotingProgress> => {
    const response = await api.get<{
        success: boolean;
        progress: {
            total_guests: number;
            guests_completed: number;
            progress_percentage: number;
            winner_id?: string;
        };
    }>(`/votes/sessions/${sessionId}/progress`);

    // Transform snake_case to camelCase
    return {
        totalGuests: response.data.progress.total_guests,
        guestsCompleted: response.data.progress.guests_completed,
        progressPercentage: response.data.progress.progress_percentage,
        winnerId: response.data.progress.winner_id,
    };
};

/**
 * Get winner for a completed session
 */
export const getWinner = async (sessionId: string): Promise<WinnerResponse> => {
    const response = await api.get<BackendWinnerResponse>(`/votes/sessions/${sessionId}/winner`);

    // Backend returns { success: true, winner: { meal_id, meal, vote_percentage, yes_votes, total_votes } }
    // Frontend expects { winner: Meal }
    if (response.data.success && response.data.winner) {
        return {
            winner: response.data.winner.meal,
            // Session is not used in Winner component, so we provide a minimal object
            session: {
                id: sessionId,
                vibe: '',
                headcount: 0,
                dietaryRestrictions: {},
                status: 'completed',
                meals: [],
                createdAt: '',
                expiresAt: '',
            },
        };
    }

    throw new Error('No winner available yet');
};

/**
 * Get voting status for a specific guest
 */
export const getVotingStatus = async (
    sessionId: string,
    guestId: string
): Promise<VotingStatus> => {
    const response = await api.get<VotingStatus>(
        `/votes/sessions/${sessionId}/voting-status/${guestId}`
    );
    return response.data;
};

/**
 * Get vote statistics for a specific meal
 */
export const getMealStats = async (sessionId: string, mealId: string): Promise<{
    yes_votes: number;
    no_votes: number;
    total_votes: number;
    vote_percentage: number;
}> => {
    const response = await api.get(`/votes/sessions/${sessionId}/meals/${mealId}/stats`);
    return response.data.stats;
};

/**
 * Get all votes for a session (admin/debug only)
 */
export const getSessionVotes = async (sessionId: string) => {
    const response = await api.get(`/votes/sessions/${sessionId}/votes`);
    return response.data;
};

// Made with Bob
