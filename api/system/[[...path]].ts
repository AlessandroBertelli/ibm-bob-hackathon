/**
 * api/system/[[...path]].ts — Consolidated System & Health API.
 * Handles uptime probes and service status:
 * - GET /api/system/health        (uptime probe)
 * - GET /api/system/status        (service indicator)
 * - GET /api/system/ai/health     (AI service mode)
 */

import { route, AuthedRequest } from '../_lib/handler';
import { dataService, serviceMode, isUsingMockServices } from '../../backend/src/services/service-factory';
import { rateLimit } from '../_lib/ratelimit';

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

export default route({ methods: ['GET'], auth: false }, async (req: AuthedRequest, res) => {
    const pathRaw = req.query.path || [];
    const path = Array.isArray(pathRaw) ? pathRaw : [pathRaw];
    const method = req.method;

    console.log(`[api/system] ${method} /${path.join('/')}`);

    // --- GET /api/system/health ---
    if (path[0] === 'health' && path.length === 1) {
        res.status(200).json({
            status: 'ok',
            mode: serviceMode,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // --- GET /api/system/status ---
    if (path[0] === 'status') {
        await rateLimit(req, 'status', 60, 60);

        const rows = await dataService.listServiceStatus();
        const byKey = new Map(rows.map((r) => [r.service, r]));

        const services: ServicePayload[] = TRACKED.map((s) => {
            const r = byKey.get(s.key);
            return {
                key: s.key,
                label: s.label,
                outcome: r?.outcome ?? 'ok',
                last_attempt_at: r?.last_attempt_at ?? null,
            };
        });

        services.push({
            key: 'vercel',
            label: 'Vercel — frontend + serverless API',
            outcome: 'ok',
            last_attempt_at: new Date().toISOString(),
        });

        res.status(200).json({ services });
        return;
    }

    // --- GET /api/system/ai/health ---
    if (path[0] === 'ai' && path[1] === 'health') {
        res.status(200).json({
            ok: true,
            mode: serviceMode,
            provider: isUsingMockServices ? 'mock' : 'openrouter+imagegen',
            image_providers: process.env.IMAGE_PROVIDERS || 'pollinations',
        });
        return;
    }

    res.status(404).json({ error: 'Not found' });
    return;
});

// Made with Bob
