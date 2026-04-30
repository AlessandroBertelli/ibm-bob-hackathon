/**
 * AI Controller
 * Handles AI-related HTTP requests for meal generation
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { GenerateMealsRequest } from '../types/ai.types';
import { aiService, firebaseService } from '../services/service-factory';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/errors.util';

/**
 * Generate meals
 * POST /api/ai/generate-meals
 * Public endpoint (used during session creation)
 */
export const generateMeals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { vibe, headcount, dietary_restrictions } = req.body as GenerateMealsRequest;

        // Validate input
        if (!vibe || typeof vibe !== 'string' || vibe.trim().length === 0) {
            throw new ValidationError('Vibe is required and must be a non-empty string');
        }

        if (!headcount || typeof headcount !== 'number' || headcount < 1 || headcount > 50) {
            throw new ValidationError('Headcount must be a number between 1 and 50');
        }

        const restrictions = dietary_restrictions || [];
        if (!Array.isArray(restrictions)) {
            throw new ValidationError('Dietary restrictions must be an array');
        }

        // Sanitize vibe (remove potentially problematic characters)
        const sanitizedVibe = vibe.trim().substring(0, 100);

        // Generate meals with images
        console.log(`Generating meals for vibe: ${sanitizedVibe}, headcount: ${headcount}`);
        const meals = await aiService.generateMealsWithImages(
            sanitizedVibe,
            headcount,
            restrictions
        );

        res.status(200).json({
            success: true,
            meals: meals.map(meal => ({
                id: meal.id,
                title: meal.title,
                description: meal.description,
                image_url: meal.image_url,
                ingredients: meal.ingredients,
            })),
        });

    } catch (error: any) {
        console.error('Generate meals error:', error);

        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else {
            res.status(500).json({
                error: 'Failed to generate meals',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
};

/**
 * Regenerate meals for an existing session
 * POST /api/ai/regenerate-meals/:sessionId
 * Requires authentication
 */
export const regenerateMeals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AuthenticationError('Authentication required');
        }

        const { sessionId } = req.params;

        if (!sessionId || typeof sessionId !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        // Verify session exists and user is the host
        const session = await firebaseService.getSession(sessionId);

        if (session.host_id !== req.user.userId) {
            throw new AuthenticationError('Only the host can regenerate meals');
        }

        // Check if session is in a valid state for regeneration
        if (session.status === 'completed') {
            throw new ValidationError('Cannot regenerate meals for completed sessions');
        }

        console.log(`Regenerating meals for session: ${sessionId}`);

        // Regenerate meals
        const result = await aiService.regenerateMealOptions(
            sessionId,
            session.vibe,
            session.headcount,
            session.dietary_restrictions
        );

        res.status(200).json({
            success: true,
            message: 'Meals regenerated successfully',
            session: {
                id: result.session.id,
                vibe: result.session.vibe,
                headcount: result.session.headcount,
                dietary_restrictions: result.session.dietary_restrictions,
                status: result.session.status,
            },
            meals: result.meals.map((meal: any) => ({
                id: meal.id,
                title: meal.title,
                description: meal.description,
                image_url: meal.image_url,
                ingredients: meal.ingredients,
            })),
        });

    } catch (error: any) {
        console.error('Regenerate meals error:', error);

        if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else if (error instanceof AuthenticationError) {
            res.status(401).json({
                error: error.message,
            });
        } else if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else {
            res.status(500).json({
                error: 'Failed to regenerate meals',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
};

/**
 * Test AI service health
 * GET /api/ai/health
 * Public endpoint for testing AI service connectivity
 */
export const checkAIHealth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const hasApiKey = !!process.env.OPENAI_API_KEY;

        res.status(200).json({
            success: true,
            ai_service: {
                configured: hasApiKey,
                model: 'gpt-3.5-turbo',
                image_model: 'dall-e-3',
                status: hasApiKey ? 'ready' : 'not configured',
            },
        });

    } catch (error: any) {
        console.error('AI health check error:', error);
        res.status(500).json({
            error: 'Failed to check AI service health',
        });
    }
};

// Made with Bob