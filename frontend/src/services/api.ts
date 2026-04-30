// Base API configuration with axios

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/storage';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAuthToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        // Handle different error scenarios
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data as { message?: string; error?: string };
            const url = error.config?.url || '';

            // Don't auto-redirect on auth endpoints - let components handle it
            const isAuthEndpoint = url.includes('/auth/verify') || url.includes('/auth/magic-link');

            switch (status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    // BUT: Don't redirect if we're on an auth endpoint
                    if (!isAuthEndpoint) {
                        removeAuthToken();
                        toast.error('Session expired. Please login again.');
                        window.location.href = '/';
                    }
                    break;
                case 403:
                    if (!isAuthEndpoint) {
                        toast.error('Access denied');
                    }
                    break;
                case 404:
                    if (!isAuthEndpoint) {
                        toast.error(data.message || 'Resource not found');
                    }
                    break;
                case 429:
                    toast.error('Too many requests. Please try again later.');
                    break;
                case 500:
                    if (!isAuthEndpoint) {
                        toast.error('Server error. Please try again later.');
                    }
                    break;
                default:
                    if (!isAuthEndpoint) {
                        toast.error(data.message || data.error || 'An error occurred');
                    }
            }
        } else if (error.request) {
            // Network error
            toast.error('Network error. Please check your connection.');
        } else {
            // Other errors
            toast.error('An unexpected error occurred');
        }

        return Promise.reject(error);
    }
);

export default api;

// Made with Bob
