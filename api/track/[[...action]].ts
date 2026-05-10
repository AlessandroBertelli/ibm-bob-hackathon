/**
 * api/track/[[...action]].ts — Consolidated Tracking API.
 * Handles anonymous and authenticated visit/login beacons:
 * - POST /api/track/visit    (anonymous visit)
 * - POST /api/track/login    (authenticated login)
 */

import { route, AuthedRequest } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { AuthenticationError, ValidationError } from '../../backend/src/utils/errors.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['POST'], auth: false }, async (req: AuthedRequest, res) => {
    const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;

    // --- POST /api/track/visit ---
    if (action === 'visit') {
        await rateLimit(req, 'track_visit', 60, 3600);

        const body = (req.body ?? {}) as { fingerprint?: unknown };
        const fp = typeof body.fingerprint === 'string' ? body.fingerprint.trim() : '';
        if (fp.length > 128) throw new ValidationError('fingerprint too long');

        void dataService.recordEvent({
            type: 'visit',
            fingerprint: fp || null,
        });

        res.status(204).end();
        return;
    }

    // --- POST /api/track/login ---
    if (action === 'login') {
        if (!req.user) throw new AuthenticationError();
        await rateLimit(req, 'track_login', 30, 3600);

        void dataService.recordEvent({ type: 'login', user_id: req.user.id });

        res.status(204).end();
        return;
    }

    res.status(404).json({ error: 'Not found' });
    return;
});

// Made with Bob
