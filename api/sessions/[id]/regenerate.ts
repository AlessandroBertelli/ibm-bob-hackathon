/**
 * POST /api/sessions/:id/regenerate — wipe meals + re-run the AI.
 */

import { route } from '../../_lib/handler';
import { dataService } from '../../../backend/src/services/service-factory';
import { isUuid } from '../../../backend/src/utils/validation.util';
import {
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
} from '../../../backend/src/utils/errors.util';
import { buildSessionMeals } from '../../../backend/src/services/session.flow';
import { rateLimit } from '../../_lib/ratelimit';

export default route({ methods: ['POST'], auth: true }, async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const id = String(req.query.id ?? '');
    if (!isUuid(id)) throw new NotFoundError('Session not found');

    const existing = await dataService.getSessionWithMeals(id);
    if (existing.host_id !== req.user.id) throw new AuthorizationError();

    // Concurrency guard: refuse to start a second regenerate while another
    // one is still in flight. Without this, two parallel calls (still inside
    // the 5/hr rate limit) could race past delete-then-insert and leave 8
    // session_meals rows. Inspecting `status` is best-effort — there's no
    // server-side advisory lock — but it catches the realistic case of an
    // impatient host double-clicking. Audit 2026-05-07 finding M-RACE.
    if (existing.status === 'generating') {
        throw new ConflictError('A regeneration is already in progress for this session');
    }

    // Per-session bucket: 5 regenerations / hour. Plus the per-user create
    // bucket from sessions/index.ts indirectly throttles total LLM spend.
    await rateLimit(req, `regenerate_session:${id}`, 5, 3600);

    await dataService.updateSessionStatus(id, 'generating');
    await dataService.deleteSessionMeals(id);

    try {
        const meals = await buildSessionMeals({
            userId: req.user.id,
            sessionId: id,
            selectedSavedMealIds: [],
            vibe: existing.vibe,
            headcount: existing.headcount,
            dietary: existing.dietary,
        });

        await dataService.insertSessionMeals(id, meals);
        await dataService.updateSessionStatus(id, 'voting');
    } catch (err) {
        // Don't strand the session in 'generating' if buildSessionMeals fails
        // — that would also block any future regenerate via the guard above.
        await dataService.updateSessionStatus(id, 'voting').catch(() => {});
        throw err;
    }

    const refreshed = await dataService.getSessionWithMeals(id);
    res.status(200).json({ session: refreshed });
});

// Made with Bob
