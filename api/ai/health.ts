/**
 * GET /api/ai/health — reports the active SERVICE_MODE + image providers.
 */

import { route } from '../_lib/handler';
import { isUsingMockServices, serviceMode } from '../../backend/src/services/service-factory';

export default route({ methods: ['GET'] }, async (_req, res) => {
    res.status(200).json({
        ok: true,
        mode: serviceMode,
        provider: isUsingMockServices ? 'mock' : 'openrouter+imagegen',
        image_providers: process.env.IMAGE_PROVIDERS || 'pollinations',
    });
});

// Made with Bob
