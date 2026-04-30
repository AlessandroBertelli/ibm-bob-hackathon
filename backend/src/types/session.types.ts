/**
 * Session Type Definitions
 * Defines interfaces for session, meal, vote, and guest data structures
 */

/**
 * Session Status enum
 */
export enum SessionStatus {
    SETUP = 'setup',
    GENERATING = 'generating',
    VOTING = 'voting',
    COMPLETED = 'completed',
}

/**
 * Vote Type enum
 */
export enum VoteType {
    YES = 'yes',
    NO = 'no',
}

/**
 * Ingredient interface
 */
export interface Ingredient {
    name: string;
    base_quantity: number;
    unit: string;
}

/**
 * Meal interface
 */
export interface Meal {
    id: string;
    session_id: string;
    title: string;
    description: string;
    image_url?: string;
    ingredients: Ingredient[];
    created_at: number;
}

/**
 * Vote interface
 */
export interface Vote {
    id: string;
    session_id: string;
    meal_id: string;
    guest_id: string;
    vote_type: VoteType;
    created_at: number;
}

/**
 * Guest interface
 */
export interface Guest {
    id: string;
    session_id: string;
    guest_name?: string;
    has_voted: boolean;
    joined_at: number;
}

/**
 * Session interface
 */
export interface Session {
    id: string;
    vibe: string;
    headcount: number;
    dietary_restrictions: string[];
    status: SessionStatus;
    share_link?: string;
    share_token?: string;
    host_id: string;
    created_at: number;
    expires_at: number;
    meals?: { [mealId: string]: Meal };
    votes?: { [guestId: string]: { [mealId: string]: VoteType } };
    guests?: { [guestId: string]: Guest };
}

/**
 * Create Session Request Body interface
 */
export interface CreateSessionRequest {
    vibe: string;
    headcount: number;
    dietary_restrictions?: string[];
}

/**
 * Join Session Request Body interface
 */
export interface JoinSessionRequest {
    guest_name?: string;
}

/**
 * Submit Vote Request Body interface
 */
export interface SubmitVoteRequest {
    session_id: string;
    meal_id: string;
    guest_id: string;
    vote_type: VoteType | string;
}

/**
 * Voting Progress interface
 */
export interface VotingProgress {
    total_guests: number;
    guests_completed: number;
    progress_percentage: number;
    winner_id?: string;
}

/**
 * Winner Result interface
 */
export interface WinnerResult {
    winner_id: string;
    meal: Meal;
    vote_percentage: number;
    yes_votes: number;
    total_votes: number;
}

/**
 * Session Response interface
 */
export interface SessionResponse {
    session_id: string;
    vibe: string;
    headcount: number;
    dietary_restrictions: string[];
    status: SessionStatus;
    share_link?: string;
    meals?: Meal[];
    created_at: number;
    expires_at: number;
}

/**
 * Firebase Session Data interface
 * Represents how session data is stored in Firebase
 */
export interface FirebaseSessionData {
    vibe: string;
    headcount: number;
    dietary_restrictions: string[];
    status: SessionStatus;
    share_token?: string;
    host_id: string;
    created_at: number;
    expires_at: number;
    meals?: { [mealId: string]: Omit<Meal, 'id' | 'session_id'> };
    votes?: { [guestId: string]: { [mealId: string]: VoteType } };
    guests?: { [guestId: string]: Omit<Guest, 'id' | 'session_id'> };
}

/**
 * Scaled Ingredient interface
 * Represents an ingredient scaled to the session's headcount
 */
export interface ScaledIngredient {
    name: string;
    quantity: number;
    unit: string;
}

// Made with Bob
