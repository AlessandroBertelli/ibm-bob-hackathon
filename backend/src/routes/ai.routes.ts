/**
 * AI Routes
 * Defines routes for AI-powered meal generation
 */

import { Router } from 'express';
import { generateMeals, regenerateMeals, checkAIHealth } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/ai/health
 * Check AI service health and configuration
 * Public endpoint
 */
router.get('/health', checkAIHealth);

/**
 * POST /api/ai/generate-meals
 * Generate meal options based on vibe, headcount, and dietary restrictions
 * Public endpoint (used during session creation)
 * 
 * Request body:
 * {
 *   "vibe": "Fancy Taco Tuesday",
 *   "headcount": 6,
 *   "dietary_restrictions": ["vegan", "gluten-free"]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "meals": [
 *     {
 *       "id": "meal_id",
 *       "title": "Meal Title",
 *       "description": "Meal description",
 *       "image_url": "https://...",
 *       "ingredients": [...]
 *     }
 *   ]
 * }
 */
router.post('/generate-meals', generateMeals);

/**
 * POST /api/ai/regenerate-meals/:sessionId
 * Regenerate meal options for an existing session
 * Requires authentication (only host can regenerate)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Meals regenerated successfully",
 *   "session": {...},
 *   "meals": [...]
 * }
 */
router.post('/regenerate-meals/:sessionId', authenticateToken, regenerateMeals);

export default router;

// Made with Bob