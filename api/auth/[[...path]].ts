/**
 * api/auth/[[...path]].ts — Consolidated Auth API.
 * Handles user profile and account deletion:
 * - GET    /api/auth/me          (profile)
 * - DELETE /api/auth/account     (delete user)
 */

import { route, AuthedRequest } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { AuthenticationError } from '../../backend/src/utils/errors.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['GET', 'DELETE'], auth: true }, async (req: AuthedRequest, res) => {
    if (!req.user) throw new AuthenticationError();

    const path = req.segments;
    const method = req.method;

    console.log(`[api/auth] ${method} /${path.join('/')}`);

    // --- GET /api/auth/me ---
    if (method === 'GET' && (path.length === 0 || path[0] === 'me')) {
        await rateLimit(req, 'auth_me', 600, 3600);
        res.status(200).json({ user: req.user });
        return;
    }

    // --- DELETE /api/auth/account ---
    if (method === 'DELETE' && path[0] === 'account') {
        await rateLimit(req, 'delete_account', 5, 600);
        await dataService.deleteAuthUser(req.user.id);
        res.status(204).end();
        return;
    }

    res.status(404).json({ error: 'Not found' });
    return;
});

// Made with Bob
