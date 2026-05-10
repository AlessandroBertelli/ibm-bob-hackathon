/**
 * GET /api/health — uptime probe.
 */

import { route } from './_lib/handler';
import { serviceMode } from '../backend/src/services/service-factory';

export default route({ methods: ['GET'] }, async (_req, res) => {
    res.status(200).json({
        status: 'ok',
        mode: serviceMode,
        timestamp: new Date().toISOString(),
    });
});

// Made with Bob
