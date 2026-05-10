/**
 * AI service types — what comes back from the LLM and what goes into the DB
 * after scaling and image generation.
 */

import { Ingredient, ScaledIngredient } from './session.types';

/** Raw meal as returned by the LLM, ingredients sized for one person. */
export interface GeneratedMeal {
    title: string;
    description: string;
    ingredients: Ingredient[];
    /** 3-6 short cooking steps. Optional because some free models drop this. */
    instructions?: string[];
    /** Only set on mock data — production goes through Pollinations. */
    image_url?: string;
}

/** A meal with image + ingredients scaled to the session's headcount. */
export interface AssembledMeal {
    title: string;
    description: string;
    image_url: string;
    ingredients: ScaledIngredient[];
    instructions: string[];
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Made with Bob
