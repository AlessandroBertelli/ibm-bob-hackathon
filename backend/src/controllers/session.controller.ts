/**
 * Session Controller
 * Handles session-related HTTP requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { SessionStatus } from '../types/session.types';
import { firebaseService, aiService } from '../services/service-factory';
import { validateAndSanitizeSessionData, validateGuestJoinData } from '../utils/validation.util';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/errors.util';
import crypto from 'crypto';

/**
 * Create a new session
 * POST /api/sessions
 * Requires authentication
 */
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AuthenticationError('Authentication required');
        }

        const sessionData = validateAndSanitizeSessionData(req.body);

        // Step 1: Create session with status "generating"
        const session = await firebaseService.createSession(sessionData, req.user.userId);

        // Update status to generating
        await firebaseService.updateSession(session.id, {
            status: SessionStatus.GENERATING
        });

        // Step 2: Generate meals asynchronously (don't wait for completion)
        // This allows the frontend to show a loading state
        generateAndAddMeals(
            session.id,
            sessionData.vibe,
            sessionData.headcount,
            sessionData.dietary_restrictions
        ).catch(error => {
            console.error('Error generating meals:', error);
            // Update session status to setup on error so user can retry
            firebaseService.updateSession(session.id, {
                status: SessionStatus.SETUP
            }).catch(err => console.error('Failed to update session status:', err));
        });

        // Step 3: Return session immediately with generating status
        res.status(201).json({
            success: true,
            session: {
                id: session.id,
                vibe: session.vibe,
                headcount: session.headcount,
                dietary_restrictions: session.dietary_restrictions,
                status: SessionStatus.GENERATING,
                created_at: session.created_at,
                expires_at: session.expires_at,
            },
            message: 'Session created. Generating meals...',
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
                errors: error.errors,
            });
        } else if (error instanceof AuthenticationError) {
            res.status(401).json({
                error: error.message,
            });
        } else {
            console.error('Create session error:', error);
            res.status(500).json({
                error: 'Failed to create session',
            });
        }
    }
};

/**
 * Helper function to generate and add meals to session
 * Runs asynchronously after session creation
 */
async function generateAndAddMeals(
    sessionId: string,
    vibe: string,
    headcount: number,
    dietaryRestrictions: string[]
): Promise<void> {
    try {
        console.log(`Generating meals for session ${sessionId}...`);

        // Generate meals with images
        const meals = await aiService.generateMealsWithImages(
            vibe,
            headcount,
            dietaryRestrictions
        );

        console.log(`Generated ${meals.length} meals for session ${sessionId}`);

        // Add meals to session in Firebase
        const mealsObject: { [key: string]: any } = {};
        meals.forEach(meal => {
            mealsObject[meal.id] = {
                title: meal.title,
                description: meal.description,
                image_url: meal.image_url,
                ingredients: meal.ingredients,
                created_at: Date.now(),
            };
        });

        // Update session with meals and change status to voting
        await firebaseService.updateSession(sessionId, {
            meals: mealsObject,
            status: SessionStatus.VOTING,
        });

        console.log(`Successfully added meals to session ${sessionId}`);
    } catch (error) {
        console.error(`Failed to generate meals for session ${sessionId}:`, error);
        throw error;
    }
}

/**
 * Get session by ID
 * GET /api/sessions/:id
 */
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        const session = await firebaseService.getSession(id);
        const meals = await firebaseService.getSessionMeals(id);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const shareLink = session.share_token
            ? `${frontendUrl}/vote/${session.share_token}`
            : undefined;

        res.status(200).json({
            success: true,
            session: {
                id: session.id,
                vibe: session.vibe,
                headcount: session.headcount,
                dietary_restrictions: session.dietary_restrictions,
                status: session.status,
                share_link: shareLink,
                meals: meals,
                created_at: session.created_at,
                expires_at: session.expires_at,
            },
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else {
            console.error('Get session error:', error);
            res.status(500).json({
                error: 'Failed to get session',
            });
        }
    }
};

/**
 * Generate share link for session
 * POST /api/sessions/:id/share-link
 * Requires authentication
 */
export const generateShareLink = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AuthenticationError('Authentication required');
        }

        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        // Verify session exists and user is the host
        const session = await firebaseService.getSession(id);

        if (session.host_id !== req.user.userId) {
            throw new AuthenticationError('Only the host can generate share links');
        }

        // Generate share token if not exists
        let shareToken = session.share_token;
        if (!shareToken) {
            shareToken = await firebaseService.generateShareToken(id);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const shareLink = `${frontendUrl}/vote/${shareToken}`;

        res.status(200).json({
            success: true,
            share_link: shareLink,
            share_token: shareToken,
        });
    } catch (error) {
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
            console.error('Generate share link error:', error);
            res.status(500).json({
                error: 'Failed to generate share link',
            });
        }
    }
};

/**
 * Join session as guest
 * POST /api/sessions/:id/join
 */
export const joinSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { guest_name } = req.body;

        if (!id || typeof id !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        // Verify session exists
        const session = await firebaseService.getSession(id);

        if (session.status === SessionStatus.COMPLETED) {
            throw new ValidationError('Session has already been completed');
        }

        // Check if session has expired
        if (session.expires_at < Date.now()) {
            throw new ValidationError('Session has expired');
        }

        // Generate guest ID
        const guestId = crypto.randomBytes(16).toString('hex');

        // Add guest to session
        await firebaseService.addGuestToSession(id, guestId, guest_name);

        res.status(200).json({
            success: true,
            guest_id: guestId,
            session: {
                id: session.id,
                vibe: session.vibe,
                status: session.status,
            },
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else {
            console.error('Join session error:', error);
            res.status(500).json({
                error: 'Failed to join session',
            });
        }
    }
};

/**
 * Get session by share token
 * GET /api/sessions/token/:token
 */
export const getSessionByToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        if (!token || typeof token !== 'string') {
            throw new ValidationError('Share token is required');
        }

        const sessionId = await firebaseService.getSessionIdFromToken(token);
        const session = await firebaseService.getSession(sessionId);
        const meals = await firebaseService.getSessionMeals(sessionId);

        res.status(200).json({
            success: true,
            session: {
                id: session.id,
                vibe: session.vibe,
                headcount: session.headcount,
                dietary_restrictions: session.dietary_restrictions,
                status: session.status,
                meals: meals,
                created_at: session.created_at,
                expires_at: session.expires_at,
            },
        });
    } catch (error) {
        if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else {
            console.error('Get session by token error:', error);
            res.status(500).json({
                error: 'Failed to get session',
            });
        }
    }
};

/**
 * Update session status
 * PATCH /api/sessions/:id/status
 * Requires authentication
 */
export const updateSessionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AuthenticationError('Authentication required');
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!id || typeof id !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        if (!status || !Object.values(SessionStatus).includes(status)) {
            throw new ValidationError('Valid status is required');
        }

        // Verify session exists and user is the host
        const session = await firebaseService.getSession(id);

        if (session.host_id !== req.user.userId) {
            throw new AuthenticationError('Only the host can update session status');
        }

        await firebaseService.updateSession(id, { status });

        res.status(200).json({
            success: true,
            message: 'Session status updated',
        });
    } catch (error) {
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
            console.error('Update session status error:', error);
            res.status(500).json({
                error: 'Failed to update session status',
            });
        }
    }
};

// Made with Bob
