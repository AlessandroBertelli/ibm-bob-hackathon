/**
 * api/saved-meals/[[...path]].ts — Consolidated Saved Meals API.
 * Handles all operations for "My Food":
 * - GET    /api/saved-meals            (list)
 * - POST   /api/saved-meals            (save)
 * - PATCH  /api/saved-meals/reorder    (bulk reorder)
 * - DELETE /api/saved-meals/:id        (remove)
 */

import { route, AuthedRequest } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import {
    AuthenticationError,
    NotFoundError,
    ValidationError,
} from '../../backend/src/utils/errors.util';
import {
    validateCreateSavedMeal,
    validateReorderSavedMeals,
    isUuid,
} from '../../backend/src/utils/validation.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['GET', 'POST', 'PATCH', 'DELETE'], auth: true }, async (req: AuthedRequest, res) => {
    if (!req.user) throw new AuthenticationError();

    const path = req.segments;
    const method = req.method;

    console.log(`[api/saved-meals] ${method} /${path.join('/')}`);

    // --- GET /api/saved-meals ---
    if (method === 'GET' && path.length === 0) {
        const meals = await dataService.listSavedMeals(req.user.id);
        res.status(200).json({ meals });
        return;
    }

    // --- POST /api/saved-meals (Save) ---
    if (method === 'POST' && path.length === 0) {
        await rateLimit(req, 'save_meal', 60, 3600);
        const { source_session_meal_id } = validateCreateSavedMeal(req.body);
        const sourceMeal = await dataService.getSessionMealById(source_session_meal_id);
        if (!sourceMeal) throw new NotFoundError('source session_meal not found');

        const saved = await dataService.insertSavedMeal({
            user_id: req.user.id,
            title: sourceMeal.title,
            description: sourceMeal.description,
            image_url: sourceMeal.image_url,
            ingredients: sourceMeal.ingredients,
            instructions: sourceMeal.instructions,
        });

        void dataService.recordEvent({ type: 'meal_saved', user_id: req.user.id });
        res.status(201).json({ meal: saved });
        return;
    }

    // --- PATCH /api/saved-meals/reorder ---
    if (method === 'PATCH' && path[0] === 'reorder') {
        await rateLimit(req, 'reorder_saved_meals', 60, 3600);
        const { ordered_ids } = validateReorderSavedMeals(req.body);
        await dataService.reorderSavedMeals(req.user.id, ordered_ids);
        res.status(204).end();
        return;
    }

    // --- DELETE /api/saved-meals/:id ---
    if (method === 'DELETE' && path[0] && isUuid(path[0])) {
        await rateLimit(req, 'delete_saved_meal', 120, 3600);
        const id = path[0];
        await dataService.deleteSavedMeal(req.user.id, id);
        res.status(204).end();
        return;
    }

    res.status(404).json({ error: 'Not found' });
    return;
});

// Made with Bob
