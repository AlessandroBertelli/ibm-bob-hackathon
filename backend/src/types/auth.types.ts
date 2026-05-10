/**
 * Auth types. Magic-link issuance and verification are handled entirely by
 * Supabase Auth — the backend only verifies bearer tokens to identify the user
 * for protected routes.
 */

import { Request } from 'express';

export interface AuthUser {
    id: string;
    email: string;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

// Made with Bob
