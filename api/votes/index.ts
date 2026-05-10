/**
 * POST /api/votes — cast a vote (wraps the cast_vote Postgres RPC).
 *
 * Rate-limited per guest_token. The RPC itself enforces "one vote per
 * (guest, meal)" via PRIMARY KEY conflict, so the limit here is a safety net
 * against pathological retry loops or attempts to spam the RPC.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { validateCastVote } from '../../backend/src/utils/validation.util';
import { rateLimit } from '../_lib/ratelimit';

const TEN_MINUTES = 600;

export default route({ methods: ['POST'] }, async (req, res) => {
    // Per-IP outer guard. Defends against an attacker rotating fake guest
    // tokens (each invalid guest_token still costs a check_rate row + an
    // RPC trip). The per-guest limit below catches the legitimate case
    // (one voter spamming).
    await rateLimit(req, 'cast_vote_ip', 600, TEN_MINUTES);

    const { guest_token, session_meal_id, value } = validateCastVote(req.body);

    // Per-guest rate limit. We use the guest_token directly (already random
    // and bound to a specific session) so the actor is the voter.
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
});

// Made with Bob
