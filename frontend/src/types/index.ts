// Type definitions for Group Food Tinder

export interface User {
    id: string;
    email: string;
    createdAt: string;
}

export interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
}

export interface Meal {
    id: string;
    sessionId: string;
    title: string;
    description: string;
    imageUrl: string;
    ingredients: Ingredient[];
    createdAt: string;
}

export const SessionStatus = {
    SETUP: 'setup',
    GENERATING: 'generating',
    VOTING: 'voting',
    COMPLETED: 'completed'
} as const;

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

export interface DietaryRestriction {
    vegan?: boolean;
    glutenFree?: boolean;
}

export interface Session {
    id: string;
    vibe: string;
    headcount: number;
    dietaryRestrictions: DietaryRestriction;
    status: SessionStatus;
    shareLink?: string;
    meals: Meal[];
    createdAt: string;
    expiresAt: string;
}

export const VoteType = {
    YES: 'yes',
    NO: 'no'
} as const;

export type VoteType = typeof VoteType[keyof typeof VoteType];

export interface Vote {
    id: string;
    sessionId: string;
    mealId: string;
    guestId: string;
    voteType: VoteType;
    createdAt: string;
}

export interface Guest {
    id: string;
    sessionId: string;
    hasVoted: boolean;
    joinedAt: string;
}

export interface VotingProgress {
    totalGuests: number;
    guestsCompleted: number;
    progressPercentage: number;
    winnerId?: string;
}

export interface VotingStatus {
    hasVoted: boolean;
    currentMealIndex: number;
    totalMeals: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ApiError {
    success: false;
    error: string;
    message: string;
    statusCode: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface MagicLinkResponse {
    message: string;
    email: string;
}

export interface SessionCreateRequest {
    vibe: string;
    headcount: number;
    dietaryRestrictions: DietaryRestriction;
}

export interface VoteRequest {
    sessionId: string;
    mealId: string;
    guestId: string;
    voteType: VoteType;
}

export interface ShareLinkResponse {
    share_link: string;
    share_token: string;
}

export interface WinnerResponse {
    winner: Meal;
    session: Session;
}

// Made with Bob
