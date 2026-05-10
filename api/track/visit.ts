/**
 * POST /api/track/visit — anonymous visit beacon.
 *
 * The frontend calls this once per AppLayout mount with the localStorage
 * fingerprint. We rate-limit per-IP to bound abuse on what's an unauth'd
 * write endpoint.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { ValidationError } from '../../backend/src/utils/errors.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['POST'] }, async (req, res) => {
    await rateLimit(req, 'track_visit', 60, 3600);

    const body = (req.body ?? {}) as { fingerprint?: unknown };
    const fp = typeof body.fingerprint === 'string' ? body.fingerprint.trim() : '';
    if (fp.length > 128) throw new ValidationError('fingerprint too long');

    void dataService.recordEvent({
        type: 'visit',
        fingerprint: fp || null,
    });

    res.status(204).end();
});

// Made with Bob
