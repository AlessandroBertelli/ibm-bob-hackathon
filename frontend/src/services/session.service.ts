// Session management service

import api from './api';
import type { Session, SessionCreateRequest, ShareLinkResponse, SessionStatus } from '../types';

/**
 * Create a new session with meal generation
 */
export const createSession = async (data: SessionCreateRequest): Promise<Session> => {
    const response = await api.post<{ success: boolean; session: Session; message?: string }>('/sessions', data);
    return response.data.session;
};

/**
 * Get session by ID (for host)
 */
export const getSession = async (sessionId: string): Promise<Session> => {
    const response = await api.get<{ success: boolean; session: Session }>(`/sessions/${sessionId}`);
    return response.data.session;
};

/**
 * Get session by share token (for guests)
 */
export const getSessionByToken = async (token: string): Promise<Session> => {
    const response = await api.get<{ success: boolean; session: Session }>(`/sessions/token/${token}`);
    return response.data.session;
};

/**
 * Generate shareable voting link for session
 */
export const generateShareLink = async (sessionId: string): Promise<ShareLinkResponse> => {
    const response = await api.post<ShareLinkResponse>(`/sessions/${sessionId}/share-link`);
    return response.data;
};

/**
 * Join a session as a guest
 */
export const joinSession = async (sessionId: string, guestId: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/join`, { guestId });
};

/**
 * Update session status
 */
export const updateSessionStatus = async (
    sessionId: string,
    status: SessionStatus
): Promise<Session> => {
    const response = await api.patch<Session>(`/sessions/${sessionId}/status`, { status });
    return response.data;
};

/**
 * Regenerate meal options for a session
 */
export const regenerateMeals = async (sessionId: string): Promise<Session> => {
    const response = await api.post<Session>(`/sessions/${sessionId}/regenerate`);
    return response.data;
};

/**
 * Delete a session
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}`);
};

// Made with Bob
