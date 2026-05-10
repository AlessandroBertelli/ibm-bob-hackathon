/**
 * GET /api/sessions/token/:token — public guest view by share token.
 *
 * Public endpoint, IP-rate-limited to bound enumeration / brute-force on the
 * share_token (16 random bytes / 128 bits → unguessable, but the lookup still
 * costs a Postgres round-trip and a malicious crawler shouldn't be free to
 * pummel it).
 */

import { route } from '../../_lib/handler';
import { dataService } from '../../../backend/src/services/service-factory';
import { NotFoundError, ValidationError } from '../../../backend/src/utils/errors.util';
import { rateLimit } from '../../_lib/ratelimit';

// share_token is encode(gen_random_bytes(16), 'hex') = 32 hex chars; allow
// some slack for any future format change.
const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{8,128}$/;

export default route({ methods: ['GET'] }, async (req, res) => {
    // 120 lookups / 10 min / IP — generous for legitimate viewers refreshing,
    // restrictive for token enumeration.
    await rateLimit(req, 'session_by_token', 120, 600);

    const token = String(req.query.token ?? '');
    if (!token) throw new NotFoundError('Session not found');
    if (!SHARE_TOKEN_RE.test(token)) {
        // Reject obvious garbage before hitting the DB.
        throw new ValidationError('invalid share token');
    }
    const session = await dataService.getSessionByShareToken(token);
    res.status(200).json({ session });
});

// Made with Bob
