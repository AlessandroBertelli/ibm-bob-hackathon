/**
 * GET /api/auth/me — verify bearer + return profile.
 */

import { route } from '../_lib/handler';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['GET'], auth: true }, async (req, res) => {
    // Cheap call, but a stolen-token attacker shouldn't be free to probe it
    // forever. 600/hr/user is well above any legitimate refresh pattern.
    await rateLimit(req, 'auth_me', 600, 3600);
    res.status(200).json({ user: req.user });
});

// Made with Bob
