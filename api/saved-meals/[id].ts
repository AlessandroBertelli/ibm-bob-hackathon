/**
 * DELETE /api/saved-meals/:id — remove one entry.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { AuthenticationError, ValidationError } from '../../backend/src/utils/errors.util';
import { isUuid } from '../../backend/src/utils/validation.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['DELETE'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    // Defense-in-depth: a stolen-token attacker can't mass-delete a user's
    // library faster than this allows. 120/hr sits comfortably above any
    // legitimate workflow.
    await rateLimit(req, 'delete_saved_meal', 120, 3600);
    const id = String(req.query.id ?? '');
    if (!isUuid(id)) throw new ValidationError('id must be a UUID');
    await dataService.deleteSavedMeal(req.user.id, id);
    res.status(204).end();
});

// Made with Bob
