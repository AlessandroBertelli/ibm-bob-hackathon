/**
 * GET  /api/saved-meals — list "My Food".
 * POST /api/saved-meals — save the meal that `source_session_meal_id` points at.
 *
 * The POST body MUST be just `{ source_session_meal_id }`. Title, description,
 * ingredients and image_url are all derived from the referenced session_meal so
 * users cannot inject arbitrary HTML or host-spoofed image URLs.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import {
    AuthenticationError,
    NotFoundError,
} from '../../backend/src/utils/errors.util';
import { validateCreateSavedMeal } from '../../backend/src/utils/validation.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['GET', 'POST'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();

    if (req.method === 'GET') {
        const meals = await dataService.listSavedMeals(req.user.id);
        res.status(200).json({ meals });
        return;
    }

    // POST — rate-limited by user id.
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
});

// Made with Bob
