/**
 * Browser-side Supabase client.
 *
 * Production: real client using the anon key. RLS protects everything.
 * Mock mode: a tiny stub that satisfies the surface we use without touching
 *   the network. Triggered only when BOTH env vars are missing AND we are
 *   not in a production build.
 *
 * In production builds, missing env vars are a hard error — we'd rather fail
 * the deploy than ship a build that pretends to authenticate without ever
 * talking to Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const isProdBuild = import.meta.env.PROD;

if (isProdBuild && (!url || !anonKey)) {
    // The build is going to fail open at runtime if we don't blow up here —
    // the mock stub would silently accept any sign-in.
    throw new Error(
        '[atavola] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are required in production builds.'
    );
}

export const isMockMode = !isProdBuild && (!url || !anonKey);

function createMockClient(): SupabaseClient {
    const noop = () => {};
    const okPromise = async () => ({ data: { session: null, user: null }, error: null });
    const errPromise = async () => ({
        error: { message: 'Supabase not configured (mock mode)' },
    });

    const subscription = { unsubscribe: noop };
    const channel = {
        on: () => channel,
        subscribe: () => channel,
        unsubscribe: noop,
    };

    return {
        auth: {
            getSession: okPromise,
            getUser: okPromise,
            signInWithOtp: errPromise,
            signOut: async () => ({ error: null }),
            exchangeCodeForSession: errPromise,
            setSession: errPromise,
            verifyOtp: errPromise,
            onAuthStateChange: () => ({ data: { subscription } }),
        },
        channel: () => channel,
        removeChannel: noop,
    } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isMockMode
    ? createMockClient()
    : createClient(url!, anonKey!, {
          auth: {
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: false,
          },
      });

if (typeof window !== 'undefined' && isMockMode) {
    console.info(
        '[atavola] Mock mode — Supabase env not set. Sign in with any email.'
    );
}

// Made with Bob
