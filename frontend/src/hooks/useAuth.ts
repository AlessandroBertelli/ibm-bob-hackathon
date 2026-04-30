// Authentication hook for managing auth state

import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as authService from '../services/auth.service';
import { getAuthToken } from '../utils/storage';

interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string) => Promise<void>;
    verify: (token: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

/**
 * Custom hook for authentication management
 */
export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is authenticated
    const isAuthenticated = !!user && !!getAuthToken();

    /**
     * Load current user on mount
     */
    useEffect(() => {
        const loadUser = async () => {
            const token = getAuthToken();
            if (token) {
                try {
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    /**
     * Request magic link
     */
    const login = useCallback(async (email: string) => {
        setIsLoading(true);
        try {
            await authService.requestMagicLink(email);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Verify magic link token
     */
    const verify = useCallback(async (token: string) => {
        setIsLoading(true);
        try {
            const authResponse = await authService.verifyMagicLink(token);
            setUser(authResponse.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Logout user
     */
    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
    }, []);

    /**
     * Refresh current user data
     */
    const refreshUser = useCallback(async () => {
        if (getAuthToken()) {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error('Failed to refresh user:', error);
            }
        }
    }, []);

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        verify,
        logout,
        refreshUser,
    };
};

// Made with Bob
