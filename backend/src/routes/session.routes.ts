/**
 * Session Routes
 * Defines routes for session management endpoints
 */

import { Router } from 'express';
import {
    createSession,
    getSession,
    generateShareLink,
    joinSession,
    getSessionByToken,
    updateSessionStatus,
} from '../controllers/session.controller';
import {
    getProgress,
    getWinner,
    getVotingStatus,
    getMealStats,
} from '../controllers/vote.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/sessions
 * Create a new session
 * Requires: Authentication
 * Body: { vibe: string, headcount: number, dietary_restrictions?: string[] }
 */
router.post('/', authenticateToken, createSession);

/**
 * GET /api/sessions/:id
 * Get session by ID
 * Optional: Authentication (for host features)
 */
router.get('/:id', optionalAuth, getSession);

/**
 * POST /api/sessions/:id/share-link
 * Generate share link for session
 * Requires: Authentication (must be host)
 */
router.post('/:id/share-link', authenticateToken, generateShareLink);

/**
 * POST /api/sessions/:id/join
 * Join session as a guest
 * Body: { guest_name?: string }
 */
router.post('/:id/join', joinSession);

/**
 * GET /api/sessions/token/:token
 * Get session by share token
 */
router.get('/token/:token', getSessionByToken);

/**
 * PATCH /api/sessions/:id/status
 * Update session status
 * Requires: Authentication (must be host)
 * Body: { status: SessionStatus }
 */
router.patch('/:id/status', authenticateToken, updateSessionStatus);

/**
 * GET /api/sessions/:id/progress
 * Get voting progress for a session
 */
router.get('/:id/progress', getProgress);

/**
 * GET /api/sessions/:id/winner
 * Get winner for a session
 */
router.get('/:id/winner', getWinner);

/**
 * GET /api/sessions/:id/voting-status
 * Get voting status (progress + winner)
 */
router.get('/:id/voting-status', getVotingStatus);

/**
 * GET /api/sessions/:sessionId/meals/:mealId/stats
 * Get vote statistics for a specific meal
 */
router.get('/:sessionId/meals/:mealId/stats', getMealStats);

export default router;

// Made with Bob
