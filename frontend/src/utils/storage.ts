// LocalStorage helpers. Supabase Auth manages its own session — these are for
// guest tokens (per-session), the redirect_to URL through magic-link auth, and
// the optional mock-mode auth bypass.

const GUEST_TOKEN_KEY = (sessionId: string) => `bm_guest_${sessionId}`;
const REDIRECT_KEY = 'bm_post_signin_redirect';
const MOCK_TOKEN_KEY = 'bm_mock_token';

function safeGet(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}
function safeSet(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* ignore */
    }
}
function safeRemove(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
}

/* ---------------- guest tokens, per session ---------------- */

export const getGuestToken = (sessionId: string): string | null =>
    safeGet(GUEST_TOKEN_KEY(sessionId));

export const setGuestToken = (sessionId: string, token: string): void =>
    safeSet(GUEST_TOKEN_KEY(sessionId), token);

/* ---------------- post-signin redirect ---------------- */

/**
 * Only same-origin paths starting with a single "/" are stored. Filters
 * protocol-relative URLs (//evil.com), absolute URLs, and javascript: /
 * data: URIs to prevent open-redirects via the magic-link flow.
 */
export const isSafeRedirectPath = (raw: unknown): raw is string => {
    if (typeof raw !== 'string') return false;
    const trimmed = raw.trim();
    if (!trimmed) return false;
    if (!trimmed.startsWith('/')) return false;
    if (trimmed.startsWith('//')) return false;
    if (/^\/\\/.test(trimmed)) return false; // /\evil.com pattern
    if (trimmed.toLowerCase().startsWith('/javascript:')) return false;
    return true;
};

export const setPostSignInRedirect = (path: string): void => {
    if (!isSafeRedirectPath(path)) return;
    safeSet(REDIRECT_KEY, path);
};
export const getPostSignInRedirect = (): string | null => {
    const raw = safeGet(REDIRECT_KEY);
    return isSafeRedirectPath(raw) ? raw : null;
};
export const clearPostSignInRedirect = (): void => safeRemove(REDIRECT_KEY);

/* ---------------- mock token (mock SERVICE_MODE only) ---------------- */

export const setMockToken = (email: string): void => safeSet(MOCK_TOKEN_KEY, `mock:${email}`);
export const getMockToken = (): string | null => safeGet(MOCK_TOKEN_KEY);
export const clearMockToken = (): void => safeRemove(MOCK_TOKEN_KEY);

/* ---------------- anonymous visitor fingerprint ---------------- */
// Used by track('visit') to dedupe a single browser across page reloads.
// Pure random — not a real fingerprint, no PII, no cross-site linkability.

const FINGERPRINT_KEY = 'bm_anon_fingerprint';

export const getOrCreateFingerprint = (): string => {
    const existing = safeGet(FINGERPRINT_KEY);
    if (existing) return existing;
    const fresh =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `fp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    safeSet(FINGERPRINT_KEY, fresh);
    return fresh;
};

// Made with Bob
