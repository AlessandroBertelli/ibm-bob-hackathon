/**
 * Custom Error Classes for the atavola API
 * Provides structured error handling with appropriate HTTP status codes
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Authentication Error (401)
 * Used when authentication fails or token is invalid
 */
export class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}

/**
 * Authorization Error (403)
 * Used when user doesn't have permission to access resource
 */
export class AuthorizationError extends ApiError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}

/**
 * Validation Error (400)
 * Used when request data fails validation
 */
export class ValidationError extends ApiError {
    public errors?: any;

    constructor(message = 'Validation failed', errors?: any) {
        super(message, 400);
        this.errors = errors;
    }
}

/**
 * Not Found Error (404)
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

/**
 * Conflict Error (409)
 * Used when request conflicts with current state
 */
export class ConflictError extends ApiError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

/**
 * Rate Limit Error (429)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends ApiError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}

/**
 * Internal Server Error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends ApiError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}

/**
 * Service Unavailable Error (503)
 * Used when external service is unavailable
 */
export class ServiceUnavailableError extends ApiError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503);
    }
}

/**
 * Error handler middleware helper
 * Formats error response consistently
 */
export const formatErrorResponse = (error: ApiError | Error) => {
    if (error instanceof ApiError) {
        return {
            error: error.message,
            statusCode: error.statusCode,
            ...(error instanceof ValidationError && error.errors ? { errors: error.errors } : {}),
        };
    }

    // Unknown error
    return {
        error: 'Internal server error',
        statusCode: 500,
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
};

// Made with Bob
