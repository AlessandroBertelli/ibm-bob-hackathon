/**
 * Authentication Service
 * Handles authentication logic including magic link generation and verification
 */

import { User } from '../types/auth.types';
import { generateMagicLinkToken, verifyMagicLinkToken, generateAuthToken } from '../utils/jwt.util';
import { validateEmail } from '../utils/validation.util';
import { AuthenticationError } from '../utils/errors.util';
import { emailService, firebaseService } from './service-factory';

/**
 * Authentication Service class
 */
class AuthService {
    /**
     * Generate and send magic link to user's email
     * @param email - User's email address
     * @returns Success status
     */
    async generateMagicLink(email: string): Promise<{ success: boolean; message: string }> {
        // Validate email
        validateEmail(email);

        // Generate magic link token
        const token = generateMagicLinkToken(email);

        // Send email with magic link
        try {
            await emailService.sendMagicLink(email, token);
            return {
                success: true,
                message: 'Magic link sent to your email',
            };
        } catch (error) {
            console.error('Failed to send magic link:', error);
            throw new AuthenticationError('Failed to send magic link');
        }
    }

    /**
     * Verify magic link token and authenticate user
     * @param token - Magic link token
     * @returns Authentication token and user info
     */
    async verifyMagicLink(token: string): Promise<{
        token: string;
        user: { id: string; email: string };
    }> {
        console.log('[AUTH SERVICE] verifyMagicLink called');
        console.log('[AUTH SERVICE] Token received:', token?.substring(0, 20) + '...');

        if (!token) {
            console.log('[AUTH SERVICE] Token is empty');
            throw new AuthenticationError('Token is required');
        }

        try {
            // Verify magic link token
            console.log('[AUTH SERVICE] Calling verifyMagicLinkToken');
            const decoded = verifyMagicLinkToken(token);
            console.log('[AUTH SERVICE] Token decoded successfully, email:', decoded.email);

            if (!decoded.email) {
                console.log('[AUTH SERVICE] No email in decoded token');
                throw new AuthenticationError('Invalid token payload');
            }

            // Create or update user in Firebase
            console.log('[AUTH SERVICE] Creating/updating user:', decoded.email);
            const user = await this.createOrUpdateUser(decoded.email);
            console.log('[AUTH SERVICE] User created/updated, ID:', user.id);

            // Generate authentication token
            console.log('[AUTH SERVICE] Generating auth token');
            const authToken = generateAuthToken(user.id, user.email);
            console.log('[AUTH SERVICE] Auth token generated successfully');

            return {
                token: authToken,
                user: {
                    id: user.id,
                    email: user.email,
                },
            };
        } catch (error) {
            console.error('[AUTH SERVICE] Error during verification:', error);
            if (error instanceof AuthenticationError) {
                throw error;
            }
            console.error('Magic link verification failed:', error);
            throw new AuthenticationError('Invalid or expired magic link');
        }
    }

    /**
     * Create or update user in Firebase
     * @param email - User's email address
     * @returns User object
     */
    async createOrUpdateUser(email: string): Promise<User> {
        try {
            return await firebaseService.createOrUpdateUser(email);
        } catch (error) {
            console.error('Failed to create/update user:', error);
            throw new AuthenticationError('Failed to authenticate user');
        }
    }

    /**
     * Get user by ID
     * @param userId - User's unique identifier
     * @returns User object or null
     */
    async getUserById(userId: string): Promise<User | null> {
        try {
            return await firebaseService.getUser(userId);
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    }

    /**
     * Resend magic link to user's email
     * @param email - User's email address
     * @returns Success status
     */
    async resendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
        // Same as generateMagicLink, but with different message
        return this.generateMagicLink(email);
    }

    /**
     * Validate authentication token
     * @param token - Authentication token
     * @returns User info if valid
     */
    async validateAuthToken(token: string): Promise<{ userId: string; email: string }> {
        if (!token) {
            throw new AuthenticationError('Token is required');
        }

        try {
            const { verifyToken } = await import('../utils/jwt.util');
            const decoded = verifyToken(token);

            if (!decoded.userId || !decoded.email) {
                throw new AuthenticationError('Invalid token payload');
            }

            // Optionally verify user still exists in database
            const user = await this.getUserById(decoded.userId);
            if (!user) {
                throw new AuthenticationError('User not found');
            }

            return {
                userId: decoded.userId,
                email: decoded.email,
            };
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            throw new AuthenticationError('Invalid or expired token');
        }
    }
}

// Export singleton instance
export default new AuthService();

// Made with Bob
