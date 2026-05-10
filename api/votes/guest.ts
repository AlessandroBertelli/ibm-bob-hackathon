/**
 * POST /api/votes/guest — mint a guest token for a session.
 * If the request is authenticated we link the guest to that user.
 *
 * Rate-limited: 30 mints / hour / IP. Anyone with the share-link can mint a
 * fresh guest, so without a cap an attacker could stuff vote counters by
 * minting unlimited identities.
 */

import { route } from '../_lib/handler';
import { dataService } from '../../backend/src/services/service-factory';
import { validateMintGuest } from '../../backend/src/utils/validation.util';
import { rateLimit } from '../_lib/ratelimit';

export default route({ methods: ['POST'] }, async (req, res) => {
    await rateLimit(req, 'mint_guest', 30, 3600);
    const { session_id } = validateMintGuest(req.body);
    const guest = await dataService.ensureGuest(session_id, req.user?.id ?? null);
    res.status(201).json({ guest_token: guest.guest_token, guest_id: guest.id });
});

// Made with Bob
