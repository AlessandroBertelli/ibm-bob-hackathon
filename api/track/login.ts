/**
 * POST /api/track/login — login beacon. Auth-required so the fingerprint
 * isn't necessary (we have the user id directly).
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { AuthenticationError } from '../../backend/src/utils/errors.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['POST'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    await rateLimit(req, 'track_login', 30, 3600);

    void dataService.recordEvent({ type: 'login', user_id: req.user.id });

    res.status(204).end();
});

// Made with Bob
