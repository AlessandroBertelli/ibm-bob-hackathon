/**
 * DELETE /api/account — permanently remove the calling user.
 *
 * Cascades:
 *   • auth.users → public.profiles (CASCADE) → public.sessions (CASCADE)
 *     → session_meals / guests / votes (CASCADE).
 *   • public.saved_meals.user_id is ON DELETE SET NULL — recipes survive
 *     as an anonymous corpus, invisible to anyone (queries filter by user_id).
 *
 * The frontend signs out and redirects after a 204.
 */

import { route } from './_lib/handler';
import { dataService } from '../backend/src/services/service-factory';
import { AuthenticationError } from '../backend/src/utils/errors.util';
import { rateLimit } from './_lib/ratelimit';

export default route({ methods: ['DELETE'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    // Defense-in-depth. The first successful call removes the user, so a
    // second call would 404 anyway, but this caps how aggressively a stolen
    // token can hammer auth.admin.deleteUser.
    await rateLimit(req, 'delete_account', 5, 600);
    await dataService.deleteAuthUser(req.user.id);
    res.status(204).end();
});

// Made with Bob
