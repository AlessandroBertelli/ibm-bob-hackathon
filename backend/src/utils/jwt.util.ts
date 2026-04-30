/**
 * JWT Utility Functions
 * Handles JWT token generation and verification
 */

import jwt from 'jsonwebtoken';
import { AuthenticationError } from './errors.util';

/**
 * JWT Payload interface
 */
export interface JwtPayload {
    [key: string]: any;
}

/**
 * Decoded JWT token interface
 */
export interface DecodedToken extends JwtPayload {
    iat: number;
    exp: number;
}

/**
 * Generate a JWT token
 * @param payload - Data to encode in the token
 * @param expiresIn - Token expiration time (e.g., '15m', '7d')
 * @param secret - Optional custom secret (defaults to JWT_SECRET from env)
 * @returns Signed JWT token
 */
export const generateToken = (
    payload: JwtPayload,
    expiresIn: string = process.env.JWT_EXPIRES_IN || '7d',
    secret: string = process.env.JWT_SECRET || ''
): string => {
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
        console.log('[JWT UTIL] generateToken - Secret being used:', secret.substring(0, 20) + '...');
        console.log('[JWT UTIL] generateToken - Payload:', JSON.stringify(payload));

        const token = jwt.sign(payload, secret, {
            expiresIn: expiresIn,
            issuer: 'group-food-tinder',
        } as jwt.SignOptions);

        console.log('[JWT UTIL] generateToken - Token generated successfully');
        return token;
    } catch (error) {
        console.error('[JWT UTIL] generateToken - Failed:', error);
        throw new Error(`Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @param secret - Optional custom secret (defaults to JWT_SECRET from env)
 * @returns Decoded token payload
 * @throws AuthenticationError if token is invalid or expired
 */
export const verifyToken = (
    token: string,
    secret: string = process.env.JWT_SECRET || ''
): DecodedToken => {
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
        console.log('[JWT UTIL] verifyToken - Attempting to verify token');
        console.log('[JWT UTIL] verifyToken - Secret being used:', secret.substring(0, 20) + '...');

        const decoded = jwt.verify(token, secret, {
            issuer: 'group-food-tinder',
        }) as DecodedToken;

        console.log('[JWT UTIL] verifyToken - Token verified successfully');
        return decoded;
    } catch (error) {
        console.error('[JWT UTIL] verifyToken - Verification failed:', error);
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthenticationError('Token has expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.error('[JWT UTIL] verifyToken - JsonWebTokenError details:', error.message);
            throw new AuthenticationError('Invalid token');
        } else {
            throw new AuthenticationError('Token verification failed');
        }
    }
};

/**
 * Generate a magic link token for email authentication
 * @param email - User's email address
 * @returns Signed JWT token with email payload
 */
export const generateMagicLinkToken = (email: string): string => {
    const secret = process.env.MAGIC_LINK_SECRET || process.env.JWT_SECRET || '';
    const expiresIn = process.env.MAGIC_LINK_EXPIRES_IN || '15m';

    console.log('[JWT UTIL] generateMagicLinkToken - Secret length:', secret.length);
    console.log('[JWT UTIL] generateMagicLinkToken - Secret preview:', secret.substring(0, 20) + '...');

    const token = generateToken({ email }, expiresIn, secret);
    console.log('[JWT UTIL] generateMagicLinkToken - Generated token:', token);

    return token;
};

/**
 * Verify a magic link token
 * @param token - Magic link token to verify
 * @returns Decoded token with email
 * @throws AuthenticationError if token is invalid or expired
 */
export const verifyMagicLinkToken = (token: string): DecodedToken => {
    const secret = process.env.MAGIC_LINK_SECRET || process.env.JWT_SECRET || '';

    console.log('[JWT UTIL] verifyMagicLinkToken - Secret length:', secret.length);
    console.log('[JWT UTIL] verifyMagicLinkToken - Secret preview:', secret.substring(0, 20) + '...');
    console.log('[JWT UTIL] verifyMagicLinkToken - Token length:', token.length);
    console.log('[JWT UTIL] verifyMagicLinkToken - Full token:', token);

    return verifyToken(token, secret);
};

/**
 * Generate an authentication token for a user session
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @returns Signed JWT token for session authentication
 */
export const generateAuthToken = (userId: string, email: string): string => {
    return generateToken(
        {
            userId,
            email,
            type: 'auth',
        },
        process.env.JWT_EXPIRES_IN || '7d'
    );
};

/**
 * Decode a token without verification (for debugging)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export const decodeToken = (token: string): DecodedToken | null => {
    try {
        return jwt.decode(token) as DecodedToken;
    } catch (error) {
        return null;
    }
};

/**
 * Check if a token is expired without throwing an error
 * @param token - JWT token to check
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        return Date.now() >= decoded.exp * 1000;
    } catch (error) {
        return true;
    }
};

// Made with Bob
