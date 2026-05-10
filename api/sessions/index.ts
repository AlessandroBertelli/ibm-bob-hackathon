/**
 * POST /api/sessions — host creates a new session, AI fills in the rest.
 */

import { route } from '../_lib/handler';
import { AuthenticationError } from '../../backend/src/utils/errors.util';
import { validateCreateSession } from '../../backend/src/utils/validation.util';
import { buildSessionMeals } from '../../backend/src/services/session.flow';
import { dataService } from '../../backend/src/services/service-factory';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['POST'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    // 10 sessions / hour / user. Each session is 1 LLM + 4 image-gen calls,
    // so this is the most expensive path we expose.
    await rateLimit(req, 'create_session', 10, 3600);

    const { vibe, headcount, dietary, selected_saved_meal_ids } = validateCreateSession(req.body);

    const session = await dataService.createSession({
        host_id: req.user.id,
        vibe,
        headcount,
        dietary,
    });

    const meals = await buildSessionMeals({
        userId: req.user.id,
        sessionId: session.id,
        selectedSavedMealIds: selected_saved_meal_ids,
        vibe,
        headcount,
        dietary,
    });

    await dataService.insertSessionMeals(session.id, meals);
    await dataService.updateSessionStatus(session.id, 'voting');

    // Phase B tracking — fire-and-forget; never block the request.
    void dataService.recordEvent({
        type: 'meal_generated',
        user_id: req.user.id,
        metadata: { count: meals.length },
    });

    const full = await dataService.getSessionWithMeals(session.id);
    res.status(201).json({ session: full });
});

// Made with Bob
