// Axios instance for the atavola backend. Auth token is taken from the
// Supabase session at request time so refreshes don't strand expired bearers.

import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getMockToken } from '../utils/storage';

// baseURL resolution:
//   • VITE_API_URL explicitly set       → use it (override for any env)
//   • production build, VITE_API_URL '' → "/api" (same-origin: serverless
//     functions live at the same Vercel project as the frontend)
//   • dev build, VITE_API_URL ''        → http://localhost:3000/api (Express
//     dev-server in backend/src/dev-server.ts runs on :3000)
//
// The previous default fell back to localhost:3000 in *every* env. In a prod
// build with no VITE_API_URL set (the documented setup) every API call would
// quietly target the user's own machine. Caught in the v2.12 audit.
const apiBaseUrl =
    import.meta.env.VITE_API_URL?.trim() ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

const api: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    timeout: 90_000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // The mock-token shortcut only exists for local mock-mode dev. In a
    // production build we want a single, predictable auth path: real
    // Supabase JWT or nothing. Audit 2026-05-07 caught that a dangling
    // `bm_mock_token` in localStorage from earlier dev work would otherwise
    // get sent to the real backend on every request — the backend rejects
    // it (Supabase auth.getUser refuses non-JWTs), but the cleaner answer
    // is "don't even try in prod".
    if (!import.meta.env.PROD) {
        const mockToken = getMockToken();
        if (mockToken) {
            config.headers.Authorization = `Bearer ${mockToken}`;
            return config;
        }
    }
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data as { message?: string; error?: string };
            if (status === 429) {
                toast.error('Too many requests. Please try again later.');
            } else if (status >= 500) {
                toast.error('Server error. Please try again later.');
            } else if (status === 404) {
                // Caller surfaces this if needed; no global toast.
            } else if (status !== 401) {
                const msg = data.message || data.error;
                if (msg) toast.error(msg);
            }
        } else if (error.request) {
            toast.error('Network error. Please check your connection.');
        }
        return Promise.reject(error);
    }
);

export default api;

// Made with Bob
