/**
 * Shared handler scaffolding. Wraps each Vercel function with consistent
 * error handling, method gating, body-size enforcement, and (optional)
 * bearer-token auth.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiError, formatErrorResponse } from '../../backend/src/utils/errors.util';
import { dataService } from '../../backend/src/services/service-factory';
import type { AuthUser } from '../../backend/src/types/auth.types';
import { enforceBodyLimit } from './safety';

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

interface RouteOptions {
    methods: Method[];
    auth?: boolean;
}
export interface AuthedRequest extends VercelRequest {
    user?: AuthUser;
    /**
     * Normalized sub-path segments after the function's base route.
     * e.g. /api/sessions/mine -> ['mine']
     */
    segments: string[];
}

type RouteHandler = (req: AuthedRequest, res: VercelResponse) => unknown | Promise<unknown>;

const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

function extractToken(authHeader: string | string[] | undefined): string | null {
    const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!raw || !raw.startsWith('Bearer ')) return null;
    return raw.slice(7).trim() || null;
}

/**
 * Extracts segments from the URL after the given prefix.
 * e.g. extractSegments('/api/sessions/mine', '/api/sessions') -> ['mine']
 */
function extractSegments(url: string | undefined, prefix: string): string[] {
    if (!url) return [];
    // Remove query string
    const path = url.split('?')[0];
    if (!path.startsWith(prefix)) return [];

    return path
        .slice(prefix.length)
        .split('/')
        .filter((s) => s.length > 0);
}

export function route(opts: RouteOptions, handler: RouteHandler) {
    return async (req: VercelRequest, res: VercelResponse) => {
        try {
            // Determine the base prefix from the request path.
            // Vercel populates req.url with the full path including /api.
            const url = req.url || '';
            let prefix = '';
            if (url.startsWith('/api/sessions')) prefix = '/api/sessions';
            else if (url.startsWith('/api/votes')) prefix = '/api/votes';
            else if (url.startsWith('/api/track')) prefix = '/api/track';
            else if (url.startsWith('/api/system')) prefix = '/api/system';
            else if (url.startsWith('/api/auth')) prefix = '/api/auth';
            else if (url.startsWith('/api/saved-meals')) prefix = '/api/saved-meals';
            else if (url.startsWith('/api/cron')) prefix = '/api/cron';

            const authed = req as AuthedRequest;
            authed.segments = extractSegments(url, prefix);

            if (!opts.methods.includes(req.method as Method)) {
...
                res.setHeader('Allow', opts.methods.join(', '));
                res.status(405).json({ error: `Method ${req.method} not allowed` });
                return;
            }

            // Cap any incoming body before we do auth lookups, parsing, or
            // anything else. Catches both honest bloat and DoS attempts.
            if (req.method !== 'GET' && req.method !== 'DELETE') {
                enforceBodyLimit(req.headers as Record<string, string | string[] | undefined>);
            }

            const authed = req as AuthedRequest;
            if (opts.auth) {
                const token = extractToken(req.headers.authorization);
                if (!token) {
                    res.status(401).json({ error: 'No token provided' });
                    return;
                }
                const user = await dataService.getUserFromAccessToken(token);
                if (!user) {
                    res.status(401).json({ error: 'Invalid token' });
                    return;
                }
                authed.user = user;
            } else {
                // Best-effort attach for routes that benefit from knowing the
                // user without requiring it (e.g. linking an anonymous guest
                // to a signed-in account).
                const token = extractToken(req.headers.authorization);
                if (token) {
                    const user = await dataService.getUserFromAccessToken(token);
                    if (user) authed.user = user;
                }
            }

            await handler(authed, res);
        } catch (err) {
            if (err instanceof ApiError) {
                const formatted = formatErrorResponse(err);
                res.status(err.statusCode).json(formatted);
                return;
            }

            // Unexpected — log it server-side, but don't echo internals to
            // anonymous callers in production. (ValidationError extends
            // ApiError so it's already handled by the branch above; the
            // earlier defensive re-check here was dead code.)
            console.error('Unhandled error:', err);
            const message = err instanceof Error ? err.message : String(err);
            res.status(500).json({
                error: 'Internal Server Error',
                ...(IS_PROD ? {} : { message }),
            });
        }
    };
}

// Made with Bob
