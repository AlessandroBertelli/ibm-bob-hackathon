/**
 * Session, meal, vote, guest types — aligned with the Supabase schema in
 * supabase/migrations/0001_init.sql.
 */

export type SessionStatus = 'generating' | 'voting';
export type VoteValue = 'yes' | 'no';

export interface Ingredient {
    name: string;
    base_quantity: number;
    unit: string;
}

export interface ScaledIngredient {
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
    ingredients: ScaledIngredient[];
    instructions: string[];
    position: number;
    yes_count: number;
    no_count: number;
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

export interface CreateSessionRequest {
    vibe: string;
    headcount: number;
    dietary?: string[];
    /** Up to 4 saved-meal ids the host pre-selected; the rest is generated. */
    selected_saved_meal_ids?: string[];
}

export interface CastVoteRequest {
    guest_token: string;
    session_meal_id: string;
    value: VoteValue;
}

// Made with Bob
