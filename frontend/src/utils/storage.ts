// LocalStorage utility functions for Group Food Tinder

const AUTH_TOKEN_KEY = 'gft_auth_token';
const GUEST_ID_KEY = 'gft_guest_id';

/**
 * Store authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
        console.error('Failed to store auth token:', error);
    }
};

/**
 * Retrieve authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to retrieve auth token:', error);
        return null;
    }
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = (): void => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to remove auth token:', error);
    }
};

/**
 * Store guest ID in localStorage
 */
export const setGuestId = (id: string): void => {
    try {
        localStorage.setItem(GUEST_ID_KEY, id);
    } catch (error) {
        console.error('Failed to store guest ID:', error);
    }
};

/**
 * Retrieve guest ID from localStorage
 */
export const getGuestId = (): string | null => {
    try {
        return localStorage.getItem(GUEST_ID_KEY);
    } catch (error) {
        console.error('Failed to retrieve guest ID:', error);
        return null;
    }
};

/**
 * Remove guest ID from localStorage
 */
export const removeGuestId = (): void => {
    try {
        localStorage.removeItem(GUEST_ID_KEY);
    } catch (error) {
        console.error('Failed to remove guest ID:', error);
    }
};

/**
 * Clear all app-related data from localStorage
 */
export const clearAllStorage = (): void => {
    removeAuthToken();
    removeGuestId();
};

// Made with Bob
