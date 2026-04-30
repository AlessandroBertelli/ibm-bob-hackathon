// Authentication service for magic link flow

import api from './api';
import type { AuthResponse, MagicLinkResponse, User } from '../types';
import { setAuthToken, removeAuthToken } from '../utils/storage';

/**
 * Request a magic link to be sent to the user's email
 */
export const requestMagicLink = async (email: string): Promise<MagicLinkResponse> => {
    const response = await api.post<MagicLinkResponse>('/auth/magic-link', { email });
    return response.data;
};

/**
 * Verify magic link token and authenticate user
 */
export const verifyMagicLink = async (token: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify', { token });

    // Store auth token in localStorage
    if (response.data.token) {
        setAuthToken(response.data.token);
    }

    return response.data;
};

/**
 * Resend magic link to user's email
 */
export const resendMagicLink = async (email: string): Promise<MagicLinkResponse> => {
    const response = await api.post<MagicLinkResponse>('/auth/resend', { email });
    return response.data;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
};

/**
 * Logout user - clear auth token
 */
export const logout = (): void => {
    removeAuthToken();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('gft_auth_token');
    return !!token;
};

// Made with Bob
