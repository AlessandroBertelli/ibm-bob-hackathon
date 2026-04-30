/**
 * Authentication Type Definitions
 * Defines interfaces for authentication-related data structures
 */

import { Request } from 'express';

/**
 * User interface
 * Represents a registered user in the system
 */
export interface User {
    id: string;
    email: string;
    created_at: number;
    last_login?: number;
}

/**
 * Magic Link Token interface
 * Represents the payload of a magic link token
 */
export interface MagicLinkToken {
    email: string;
    iat: number;
    exp: number;
}

/**
 * Auth Token Payload interface
 * Represents the payload of an authentication token
 */
export interface AuthTokenPayload {
    userId: string;
    email: string;
    type: 'auth';
    iat: number;
    exp: number;
}

/**
 * Auth Request interface
 * Extends Express Request with authenticated user information
 */
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

/**
 * Magic Link Request Body interface
 */
export interface MagicLinkRequestBody {
    email: string;
}

/**
 * Magic Link Verify Query interface
 */
export interface MagicLinkVerifyQuery {
    token: string;
}

/**
 * Auth Response interface
 */
export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        email: string;
    };
    message?: string;
}

// Made with Bob
