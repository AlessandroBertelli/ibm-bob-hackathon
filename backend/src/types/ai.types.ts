/**
 * AI Service Type Definitions
 * Defines interfaces for AI-powered meal generation
 */

/**
 * Ingredient interface for AI-generated meals
 */
export interface Ingredient {
    name: string;
    base_quantity: number;
    unit: string;
}

/**
 * Generated Meal interface (from OpenAI)
 */
export interface GeneratedMeal {
    title: string;
    description: string;
    ingredients: Ingredient[];
    image_url?: string; // Optional for mock data
}

/**
 * Meal with Image interface (after image generation)
 */
export interface MealWithImage {
    id: string;
    title: string;
    description: string;
    ingredients: ScaledIngredient[];
    image_url: string;
}

/**
 * Generate Meals Request interface
 */
export interface GenerateMealsRequest {
    vibe: string;
    headcount: number;
    dietary_restrictions?: string[];
}

/**
 * Generate Meals Response interface
 */
export interface GenerateMealsResponse {
    meals: MealWithImage[];
}

/**
 * Regenerate Meals Request interface
 */
export interface RegenerateMealsRequest {
    session_id: string;
}

/**
 * Scaled Ingredient interface
 */
export interface ScaledIngredient {
    name: string;
    quantity: number;
    unit: string;
}

/**
 * OpenAI Chat Completion Message interface
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * OpenAI Image Generation Options interface
 */
export interface ImageGenerationOptions {
    prompt: string;
    model?: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
}

/**
 * AI Service Error interface
 */
export interface AIServiceError {
    code: string;
    message: string;
    retryable: boolean;
}

// Made with Bob