/**
 * GET /api/sessions/mine — host's own sessions, with voter counts.
 *
 * Powers the "My Sessions" history block on the profile page. Sorted by
 * created_at DESC by the underlying RPC.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { AuthenticationError } from '../../backend/src/utils/errors.util';

export default route({ methods: ['GET'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const sessions = await dataService.getMySessions(req.user.id);
    res.status(200).json({ sessions });
});

// Made with Bob
