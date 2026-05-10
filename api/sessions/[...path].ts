/**
 * api/sessions/[[...path]].ts — Consolidated Session API.
 * Handles all session-related operations:
 * - GET  /api/sessions/:id                 (host view)
 * - POST /api/sessions                     (create)
 * - GET  /api/sessions/mine                (host's sessions)
 * - POST /api/sessions/:id/regenerate      (regenerate meals)
 * - GET  /api/sessions/token/:token        (guest view)
 */

import { route, AuthedRequest } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { isUuid } from '../../backend/src/utils/validation.util';
import {
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
} from '../../backend/src/utils/errors.util';
import { validateCreateSession } from '../../backend/src/utils/validation.util';
import { buildSessionMeals } from '../../backend/src/services/session.flow';
import { rateLimit } from '../_lib/ratelimit';

export const maxDuration = 60;

const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{8,128}$/;

export default route({ methods: ['GET', 'POST'], auth: false }, async (req: AuthedRequest, res) => {
    const path = req.segments;
    const method = req.method;

    console.log(`[api/sessions] ${method} /${path.join('/')}`);

    // --- Public Route: GET /api/sessions/token/:token ---
    if (method === 'GET' && path[0] === 'token' && path[1]) {
        await rateLimit(req, 'session_by_token', 120, 600);
        const token = path[1];
        if (!SHARE_TOKEN_RE.test(token)) {
            throw new ValidationError('invalid share token');
        }
        const session = await dataService.getSessionByShareToken(token);
        res.status(200).json({ session });
        return;
    }

    // All other routes require authentication
    if (!req.user) throw new AuthenticationError();

    // --- GET /api/sessions/mine ---
    if (method === 'GET' && path[0] === 'mine') {
        const sessions = await dataService.getMySessions(req.user.id);
        res.status(200).json({ sessions });
        return;
    }

    // --- POST /api/sessions (Create) ---
    if (method === 'POST' && path.length === 0) {
        await rateLimit(req, 'create_session', 10, 3600);
        const { vibe, headcount, dietary, selected_saved_meal_ids } = validateCreateSession(req.body);

        console.log(`[sessions/create] Vibe: "${vibe}", Headcount: ${headcount}, Dietary: [${dietary.join(', ')}]`);

        const session = await dataService.createSession({
            host_id: req.user.id,
            vibe,
            headcount,
            dietary,
        });

        console.log(`[sessions/create] Session ${session.id} created in DB, running buildSessionMeals...`);

        try {
            const meals = await buildSessionMeals({
                userId: req.user.id,
                sessionId: session.id,
                selectedSavedMealIds: selected_saved_meal_ids,
                vibe,
                headcount,
                dietary,
            });

            console.log(`[sessions/create] Successfully generated ${meals.length} meals for ${session.id}`);

            await dataService.insertSessionMeals(session.id, meals);
            await dataService.updateSessionStatus(session.id, 'voting');

            void dataService.recordEvent({
                type: 'meal_generated',
                user_id: req.user.id,
                metadata: { count: meals.length },
            });

            const full = await dataService.getSessionWithMeals(session.id);
            res.status(201).json({ session: full });
        } catch (err) {
            console.error(`[sessions/create] buildSessionMeals failed for ${session.id}:`, err);
            // Don't leave the session in 'generating' status if AI fails.
            await dataService.updateSessionStatus(session.id, 'voting').catch(() => {});
            throw err;
        }
        return;
    }

    // --- Routes involving :id ---
    const id = path[0];
    if (id && isUuid(id)) {
        // --- POST /api/sessions/:id/regenerate ---
        if (method === 'POST' && path[1] === 'regenerate') {
            const existing = await dataService.getSessionWithMeals(id);
            if (existing.host_id !== req.user.id) throw new AuthorizationError();

            if (existing.status === 'generating') {
                throw new ConflictError('A regeneration is already in progress for this session');
            }

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
                await dataService.updateSessionStatus(id, 'voting').catch(() => {});
                throw err;
            }

            const refreshed = await dataService.getSessionWithMeals(id);
            res.status(200).json({ session: refreshed });
            return;
        }

        // --- GET /api/sessions/:id (Host View) ---
        if (method === 'GET' && path.length === 1) {
            const session = await dataService.getSessionWithMeals(id);
            if (session.host_id !== req.user.id) throw new AuthorizationError();
            res.status(200).json({ session });
            return;
        }
    }

    res.status(404).json({ error: 'Not found' });
    return;
});

// Made with Bob
