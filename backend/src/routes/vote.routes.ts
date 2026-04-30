/**
 * Vote Routes
 * Defines routes for voting endpoints
 */

import { Router } from 'express';
import {
    submitVote,
    getProgress,
    getWinner,
    getVotingStatus,
    getMealStats,
} from '../controllers/vote.controller';

const router = Router();

/**
 * POST /api/votes
 * Submit a vote for a meal
 * Body: { session_id: string, guest_id: string, meal_id: string, vote_type: 'yes' | 'no' }
 */
router.post('/', submitVote);

/**
 * GET /api/votes/sessions/:id/progress
 * Get voting progress for a session
 */
router.get('/sessions/:id/progress', getProgress);

/**
 * GET /api/votes/sessions/:id/winner
 * Get winner for a session (if determined)
 */
router.get('/sessions/:id/winner', getWinner);

/**
 * GET /api/votes/sessions/:id/voting-status
 * Get complete voting status (progress + winner)
 */
router.get('/sessions/:id/voting-status', getVotingStatus);

/**
 * GET /api/votes/sessions/:sessionId/meals/:mealId/stats
 * Get vote statistics for a specific meal
 */
router.get('/sessions/:sessionId/meals/:mealId/stats', getMealStats);

export default router;

// Made with Bob
