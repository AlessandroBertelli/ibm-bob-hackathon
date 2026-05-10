/**
 * PATCH /api/saved-meals/reorder — bulk reorder.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { AuthenticationError } from '../../backend/src/utils/errors.util';
import { validateReorderSavedMeals } from '../../backend/src/utils/validation.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['PATCH'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    // Each call does N sequential UPDATEs (capped at 500 ids by the
    // validator). 60 reorder calls / hr / user is generous for normal drag
    // usage and bounds the Postgres write rate per attacker.
    await rateLimit(req, 'reorder_saved_meals', 60, 3600);
    const { ordered_ids } = validateReorderSavedMeals(req.body);
    await dataService.reorderSavedMeals(req.user.id, ordered_ids);
    res.status(204).end();
});

// Made with Bob
