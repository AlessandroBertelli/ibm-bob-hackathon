/**
 * Simple per-actor rate limiter, backed by the `rate_log` table + the
 * `check_rate(actor, scope, max, window)` RPC defined in
 * `supabase/migrations/0001_init.sql`.
 *
 * Actor resolution:
 *   • authenticated user → `user:<id>`
 *   • else → `ip:<x-forwarded-for first hop>` (Vercel rewrites this header
 *     so a client can't spoof it)
 *   • else → `ip:unknown` (one bucket for everyone — safety net)
 */

import type { VercelRequest } from '@vercel/node';
import type { AuthedRequest } from './handler';
import { dataService } from '../../backend/src/services/service-factory';
import { RateLimitError } from '../../backend/src/utils/errors.util';

function actorKey(req: VercelRequest | AuthedRequest): string {
    const user = (req as AuthedRequest).user;
    if (user?.id) return `user:${user.id}`;

    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : fwd;
    const first = (raw ?? '').split(',')[0]?.trim();
    if (first) return `ip:${first}`;

    return 'ip:unknown';
}

/**
 * Throws RateLimitError if the actor has exceeded `max` requests in the last
 * `windowSecs` seconds for the given `scope`.
 */
export async function rateLimit(
    req: VercelRequest | AuthedRequest,
    scope: string,
    max: number,
    windowSecs: number
): Promise<void> {
    const ok = await dataService.checkRate(actorKey(req), scope, max, windowSecs);
    if (!ok) {
        throw new RateLimitError(`Rate limit exceeded for ${scope}`);
    }
}

// Made with Bob
