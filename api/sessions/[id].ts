/**
 * GET /api/sessions/:id — host view of a session.
 *
 * Auth-required and host-only. Guests use /api/sessions/token/:token instead;
 * exposing the same data via the UUID path made the UUID a permanent grant
 * if it ever leaked into a referer header, screen recording, or browser
 * history.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { isUuid } from '../../backend/src/utils/validation.util';
import {
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
} from '../../backend/src/utils/errors.util';

export default route({ methods: ['GET'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const id = String(req.query.id ?? '');
    if (!isUuid(id)) throw new NotFoundError('Session not found');

    const session = await dataService.getSessionWithMeals(id);
    if (session.host_id !== req.user.id) throw new AuthorizationError();

    res.status(200).json({ session });
});

// Made with Bob
