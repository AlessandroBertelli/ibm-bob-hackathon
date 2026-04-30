/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to requests
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { verifyToken } from '../utils/jwt.util';
import { AuthenticationError } from '../utils/errors.util';

/**
 * Authenticate token middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (!token) {
            throw new AuthenticationError('No token provided');
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded.userId || !decoded.email) {
            throw new AuthenticationError('Invalid token payload');
        }

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();
    } catch (error) {
        if (error instanceof AuthenticationError) {
            res.status(401).json({
                error: error.message,
            });
        } else {
            res.status(401).json({
                error: 'Authentication failed',
            });
        }
    }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (token) {
            const decoded = verifyToken(token);
            if (decoded.userId && decoded.email) {
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                };
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Made with Bob
