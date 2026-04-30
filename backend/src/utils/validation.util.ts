/**
 * Validation Utility Functions
 * Provides input validation helpers for the API
 */

import { ValidationError } from './errors.util';

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate email and throw error if invalid
 * @param email - Email address to validate
 * @throws ValidationError if email is invalid
 */
export const validateEmail = (email: string): void => {
    if (!email || typeof email !== 'string') {
        throw new ValidationError('Email is required');
    }

    if (!isValidEmail(email)) {
        throw new ValidationError('Invalid email format');
    }
};

/**
 * Validate session data
 * @param data - Session data to validate
 * @throws ValidationError if data is invalid
 */
export const validateSessionData = (data: any): void => {
    const errors: string[] = [];

    // Validate vibe
    if (!data.vibe || typeof data.vibe !== 'string') {
        errors.push('Vibe is required and must be a string');
    } else if (data.vibe.length < 3 || data.vibe.length > 100) {
        errors.push('Vibe must be between 3 and 100 characters');
    }

    // Validate headcount
    if (!data.headcount || typeof data.headcount !== 'number') {
        errors.push('Headcount is required and must be a number');
    } else if (data.headcount < 2 || data.headcount > 20) {
        errors.push('Headcount must be between 2 and 20');
    }

    // Validate dietary restrictions (optional)
    if (data.dietary_restrictions !== undefined) {
        if (!Array.isArray(data.dietary_restrictions)) {
            errors.push('Dietary restrictions must be an array');
        } else {
            const validRestrictions = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'];
            const invalidRestrictions = data.dietary_restrictions.filter(
                (r: any) => typeof r !== 'string' || !validRestrictions.includes(r.toLowerCase())
            );
            if (invalidRestrictions.length > 0) {
                errors.push(`Invalid dietary restrictions: ${invalidRestrictions.join(', ')}`);
            }
        }
    }

    if (errors.length > 0) {
        throw new ValidationError('Session validation failed', errors);
    }
};

/**
 * Validate vote data
 * @param data - Vote data to validate
 * @throws ValidationError if data is invalid
 */
export const validateVoteData = (data: any): void => {
    const errors: string[] = [];

    // Validate session_id
    if (!data.session_id || typeof data.session_id !== 'string') {
        errors.push('Session ID is required and must be a string');
    }

    // Validate meal_id
    if (!data.meal_id || typeof data.meal_id !== 'string') {
        errors.push('Meal ID is required and must be a string');
    }

    // Validate guest_id
    if (!data.guest_id || typeof data.guest_id !== 'string') {
        errors.push('Guest ID is required and must be a string');
    }

    // Validate vote_type
    if (!data.vote_type || typeof data.vote_type !== 'string') {
        errors.push('Vote type is required and must be a string');
    } else if (!['yes', 'no'].includes(data.vote_type.toLowerCase())) {
        errors.push('Vote type must be either "yes" or "no"');
    }

    if (errors.length > 0) {
        throw new ValidationError('Vote validation failed', errors);
    }
};

/**
 * Validate meal data
 * @param data - Meal data to validate
 * @throws ValidationError if data is invalid
 */
export const validateMealData = (data: any): void => {
    const errors: string[] = [];

    // Validate title
    if (!data.title || typeof data.title !== 'string') {
        errors.push('Title is required and must be a string');
    } else if (data.title.length < 3 || data.title.length > 100) {
        errors.push('Title must be between 3 and 100 characters');
    }

    // Validate description
    if (!data.description || typeof data.description !== 'string') {
        errors.push('Description is required and must be a string');
    } else if (data.description.length < 10 || data.description.length > 500) {
        errors.push('Description must be between 10 and 500 characters');
    }

    // Validate image_url (optional)
    if (data.image_url !== undefined && typeof data.image_url !== 'string') {
        errors.push('Image URL must be a string');
    }

    // Validate ingredients
    if (!data.ingredients || !Array.isArray(data.ingredients)) {
        errors.push('Ingredients are required and must be an array');
    } else if (data.ingredients.length === 0) {
        errors.push('At least one ingredient is required');
    } else {
        data.ingredients.forEach((ingredient: any, index: number) => {
            if (!ingredient.name || typeof ingredient.name !== 'string') {
                errors.push(`Ingredient ${index + 1}: name is required and must be a string`);
            }
            if (ingredient.base_quantity === undefined || typeof ingredient.base_quantity !== 'number') {
                errors.push(`Ingredient ${index + 1}: base_quantity is required and must be a number`);
            }
            if (!ingredient.unit || typeof ingredient.unit !== 'string') {
                errors.push(`Ingredient ${index + 1}: unit is required and must be a string`);
            }
        });
    }

    if (errors.length > 0) {
        throw new ValidationError('Meal validation failed', errors);
    }
};

/**
 * Validate guest join data
 * @param data - Guest data to validate
 * @throws ValidationError if data is invalid
 */
export const validateGuestJoinData = (data: any): void => {
    const errors: string[] = [];

    // Validate session_id
    if (!data.session_id || typeof data.session_id !== 'string') {
        errors.push('Session ID is required and must be a string');
    }

    // Guest name is optional but if provided must be valid
    if (data.guest_name !== undefined) {
        if (typeof data.guest_name !== 'string') {
            errors.push('Guest name must be a string');
        } else if (data.guest_name.length > 50) {
            errors.push('Guest name must be less than 50 characters');
        }
    }

    if (errors.length > 0) {
        throw new ValidationError('Guest join validation failed', errors);
    }
};

/**
 * Sanitize string input
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
    if (typeof input !== 'string') {
        return '';
    }
    // Remove any HTML tags and trim whitespace
    return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate and sanitize session data
 * @param data - Session data to validate and sanitize
 * @returns Sanitized session data
 */
export const validateAndSanitizeSessionData = (data: any): any => {
    validateSessionData(data);

    return {
        vibe: sanitizeString(data.vibe),
        headcount: parseInt(data.headcount, 10),
        dietary_restrictions: data.dietary_restrictions
            ? data.dietary_restrictions.map((r: string) => sanitizeString(r).toLowerCase())
            : [],
    };
};

/**
 * Check if a string is a valid UUID v4
 * @param uuid - String to check
 * @returns true if valid UUID v4, false otherwise
 */
export const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Made with Bob
