// Type definitions — mirror the Postgres schema (snake_case fields).

export type SessionStatus = 'generating' | 'voting';
export type VoteValue = 'yes' | 'no';

export interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
}

export interface SessionMeal {
    id: string;
    session_id: string;
    source_saved_meal_id: string | null;
    title: string;
    description: string;
    image_url: string | null;
    ingredients: Ingredient[];
    instructions: string[];
    position: number;
    yes_count: number;
    no_count: number;
    created_at: string;
}

export interface Session {
    id: string;
    host_id: string;
    vibe: string;
    headcount: number;
    dietary: string[];
    share_token: string;
    status: SessionStatus;
    created_at: string;
    expires_at: string;
}

export interface SessionWithMeals extends Session {
    meals: SessionMeal[];
}

/**
 * A meal with cooking steps, image, ingredients — the shape rendered in any
 * detail modal. Both SessionMeal and SavedMeal satisfy this.
 */
export interface DisplayMeal {
    title: string;
    description: string;
    image_url: string | null;
    ingredients: Ingredient[];
    instructions: string[];
}

export interface SavedMeal {
    id: string;
    user_id: string;
    title: string;
    description: string;
    image_url: string | null;
    ingredients: Ingredient[];
    instructions: string[];
    position: number;
    created_at: string;
}

export interface MySession {
    id: string;
    vibe: string;
    headcount: number;
    dietary: string[];
    share_token: string;
    status: SessionStatus;
    created_at: string;
    expires_at: string;
    voter_count: number;
}

export interface AuthUser {
    id: string;
    email: string;
}

export interface DietaryRestrictions {
    vegan: boolean;
    glutenFree: boolean;
}

// Made with Bob
