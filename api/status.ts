/**
 * GET /api/status — landing-page service indicator.
 *
 * Returns a list of probe-able services with the most-recent observed outcome.
 * Outcomes are recorded by services/openrouter.service.ts and
 * services/imagegen/index.ts after every real call (no synthetic probing).
 *
 * Vercel is implicit: if this endpoint responds, Vercel is alive.
 */

import { route } from './_lib/handler';
import { dataService } from '../backend/src/services/service-factory';
import { rateLimit } from './_lib/ratelimit';

export interface ServicePayload {
    key: string;
    label: string;
    outcome: 'ok' | 'rate_limited' | 'error';
    last_attempt_at: string | null;
}

const TRACKED: Array<{ key: string; label: string }> = [
    { key: 'openrouter', label: 'OpenRouter — free models with rotation' },
    { key: 'imagegen', label: 'Image gen — Pollinations / Hugging Face / Cloudflare with rotation' },
];

export default route({ methods: ['GET'] }, async (req, res) => {
    // Public endpoint, called once on landing-page mount. 60/min/IP is
    // generous for legitimate polling and bounds malicious enumeration.
    await rateLimit(req, 'status', 60, 60);

    const rows = await dataService.listServiceStatus();
    const byKey = new Map(rows.map((r) => [r.service, r]));

    const services: ServicePayload[] = TRACKED.map((s) => {
        const r = byKey.get(s.key);
        return {
            key: s.key,
            label: s.label,
            // No record yet → assume green. Better UX than "unknown" on a
            // fresh deployment with no AI calls yet.
            outcome: r?.outcome ?? 'ok',
            last_attempt_at: r?.last_attempt_at ?? null,
        };
    });

    // Vercel is implicit — this endpoint responding is the proof.
    services.push({
        key: 'vercel',
        label: 'Vercel — frontend + serverless API',
        outcome: 'ok',
        last_attempt_at: new Date().toISOString(),
    });

    res.status(200).json({ services });
});

// Made with Bob
