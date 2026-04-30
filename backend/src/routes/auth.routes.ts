/**
 * Authentication Routes
 * Defines routes for authentication endpoints
 */

import { Router } from 'express';
import {
    requestMagicLink,
    verifyMagicLink,
    resendMagicLink,
    getCurrentUser,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/magic-link
 * Request a magic link to be sent to email (alias for /request-magic-link)
 * Body: { email: string }
 */
router.post('/magic-link', requestMagicLink);

/**
 * POST /api/auth/request-magic-link
 * Request a magic link to be sent to email
 * Body: { email: string }
 */
router.post('/request-magic-link', requestMagicLink);

/**
 * POST /api/auth/verify
 * Verify magic link token and get auth token
 * Body: { token: string }
 */
router.post('/verify', verifyMagicLink);

/**
 * POST /api/auth/resend-magic-link
 * Resend magic link to email
 * Body: { email: string }
 */
router.post('/resend-magic-link', resendMagicLink);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Requires: Authorization header with Bearer token
 */
router.get('/me', authenticateToken, getCurrentUser);

export default router;

// Made with Bob
