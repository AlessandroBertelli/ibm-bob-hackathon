/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { validateEmail } from '../utils/validation.util';
import { AuthenticationError, ValidationError } from '../utils/errors.util';

/**
 * Request magic link
 * POST /api/auth/request-magic-link
 */
export const requestMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new ValidationError('Email is required');
        }

        validateEmail(email);

        const result = await authService.generateMagicLink(email);

        res.status(200).json({
            success: true,
            message: result.message,
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
            console.error('Request magic link error:', error);
            res.status(500).json({
                error: 'Failed to send magic link',
            });
        }
    }
};

/**
 * Verify magic link
 * POST /api/auth/verify
 */
export const verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;

        console.log('[AUTH CONTROLLER] Verify magic link request received');
        console.log('[AUTH CONTROLLER] Token present:', !!token);
        console.log('[AUTH CONTROLLER] Token type:', typeof token);
        console.log('[AUTH CONTROLLER] Token length:', token?.length);

        if (!token || typeof token !== 'string') {
            console.log('[AUTH CONTROLLER] Token validation failed');
            throw new ValidationError('Token is required');
        }

        console.log('[AUTH CONTROLLER] Calling authService.verifyMagicLink');
        const result = await authService.verifyMagicLink(token);
        console.log('[AUTH CONTROLLER] Verification successful, user:', result.user.email);

        res.status(200).json({
            success: true,
            token: result.token,
            user: result.user,
        });
    } catch (error) {
        console.error('[AUTH CONTROLLER] Verification error:', error);
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else if (error instanceof AuthenticationError) {
            res.status(401).json({
                error: error.message,
            });
        } else {
            console.error('Verify magic link error:', error);
            res.status(500).json({
                error: 'Failed to verify magic link',
            });
        }
    }
};

/**
 * Resend magic link
 * POST /api/auth/resend-magic-link
 */
export const resendMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new ValidationError('Email is required');
        }

        validateEmail(email);

        const result = await authService.resendMagicLink(email);

        res.status(200).json({
            success: true,
            message: result.message,
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
            console.error('Resend magic link error:', error);
            res.status(500).json({
                error: 'Failed to resend magic link',
            });
        }
    }
};

/**
 * Get current user
 * GET /api/auth/me
 * Requires authentication
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // User info is attached by auth middleware
        const authReq = req as any;

        if (!authReq.user) {
            throw new AuthenticationError('Not authenticated');
        }

        const user = await authService.getUserById(authReq.user.userId);

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_login: user.last_login,
            },
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            res.status(401).json({
                error: error.message,
            });
        } else {
            console.error('Get current user error:', error);
            res.status(500).json({
                error: 'Failed to get user information',
            });
        }
    }
};

// Made with Bob
