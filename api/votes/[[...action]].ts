/**
 * api/votes/[[...action]].ts — Consolidated Voting API.
 * Handles guest token minting and casting votes:
 * - POST /api/votes            (cast vote)
 * - POST /api/votes/guest      (mint guest token)
 */

import { route, AuthedRequest } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { validateCastVote, validateMintGuest } from '../../backend/src/utils/validation.util';
import { rateLimit } from '../_lib/ratelimit';

const TEN_MINUTES = 600;

export default route({ methods: ['POST'], auth: false }, async (req: AuthedRequest, res) => {
    const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;

    // --- POST /api/votes/guest ---
    if (action === 'guest') {
        await rateLimit(req, 'mint_guest', 30, 3600);
        const { session_id } = validateMintGuest(req.body);
        const guest = await dataService.ensureGuest(session_id, req.user?.id ?? null);
        res.status(201).json({ guest_token: guest.guest_token, guest_id: guest.id });
        return;
    }

    // --- POST /api/votes (Cast Vote) ---
    if (!action || action === 'index') {
        // Per-IP outer guard.
        await rateLimit(req, 'cast_vote_ip', 600, TEN_MINUTES);

        const { guest_token, session_meal_id, value } = validateCastVote(req.body);

        // Per-guest rate limit.
        const ok = await dataService.checkRate(
            `guest:${guest_token}`,
            'cast_vote',
            200,
            TEN_MINUTES
        );
        if (!ok) {
            res.status(429).json({ error: 'Rate limit exceeded for cast_vote' });
            return;
        }

        await dataService.castVote(guest_token, session_meal_id, value);
        res.status(204).end();
        return;
    }

    res.status(404).json({ error: 'Not found' });
    return;
});

// Made with Bob
