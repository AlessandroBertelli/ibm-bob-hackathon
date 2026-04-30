/**
 * Mock Firebase Service
 * Provides in-memory data store for local testing without Firebase
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import {
    Session,
    SessionStatus,
    Meal,
    Vote,
    VoteType,
    Guest,
    FirebaseSessionData,
} from '../../types/session.types';
import { User } from '../../types/auth.types';
import { NotFoundError, InternalServerError } from '../../utils/errors.util';

/**
 * In-memory data stores
 */
const users = new Map<string, User>();
const sessions = new Map<string, FirebaseSessionData>();
const shareTokens = new Map<string, { session_id: string; created_at: number }>();

/**
 * Event emitter for real-time updates
 */
const eventEmitter = new EventEmitter();

/**
 * Mock Firebase Service class
 */
class MockFirebaseService {
    private initialized: boolean = true;

    constructor() {
        console.log('✅ Mock Firebase service initialized (in-memory mode)');
    }

    /**
     * Ensure Firebase is initialized (always true for mock)
     */
    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new InternalServerError('Mock Firebase service is not initialized');
        }
    }

    /**
     * Create or update a user
     * @param email - User's email address
     * @returns User object
     */
    async createOrUpdateUser(email: string): Promise<User> {
        this.ensureInitialized();

        const userId = Buffer.from(email).toString('base64').replace(/=/g, '');
        const now = Date.now();

        const existingUser = users.get(userId);

        if (existingUser) {
            // Update last login
            const updatedUser: User = {
                ...existingUser,
                last_login: now,
            };
            users.set(userId, updatedUser);
            console.log(`[MOCK FIREBASE] Updated user: ${email}`);
            return updatedUser;
        } else {
            // Create new user
            const user: User = {
                id: userId,
                email,
                created_at: now,
                last_login: now,
            };
            users.set(userId, user);
            console.log(`[MOCK FIREBASE] Created user: ${email}`);
            return user;
        }
    }

    /**
     * Get user by ID
     * @param userId - User's unique identifier
     * @returns User object or null
     */
    async getUser(userId: string): Promise<User | null> {
        this.ensureInitialized();
        const user = users.get(userId);
        console.log(`[MOCK FIREBASE] Get user: ${userId} - ${user ? 'found' : 'not found'}`);
        return user || null;
    }

    /**
     * Create a new session
     * @param data - Session creation data
     * @param hostId - Host user ID
     * @returns Created session
     */
    async createSession(
        data: { vibe: string; headcount: number; dietary_restrictions: string[] },
        hostId: string
    ): Promise<Session> {
        this.ensureInitialized();

        const sessionId = crypto.randomBytes(16).toString('hex');
        const now = Date.now();
        const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

        const sessionData: FirebaseSessionData = {
            vibe: data.vibe,
            headcount: data.headcount,
            dietary_restrictions: data.dietary_restrictions,
            status: SessionStatus.SETUP,
            host_id: hostId,
            created_at: now,
            expires_at: expiresAt,
        };

        sessions.set(sessionId, sessionData);
        console.log(`[MOCK FIREBASE] Created session: ${sessionId}`);

        // Emit change event
        this.emitSessionChange(sessionId);

        return {
            id: sessionId,
            ...sessionData,
        } as Session;
    }

    /**
     * Get session by ID
     * @param sessionId - Session ID
     * @returns Session object
     */
    async getSession(sessionId: string): Promise<Session> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        console.log(`[MOCK FIREBASE] Get session: ${sessionId}`);

        // Convert FirebaseSessionData to Session format
        const session: Session = {
            id: sessionId,
            vibe: sessionData.vibe,
            headcount: sessionData.headcount,
            dietary_restrictions: sessionData.dietary_restrictions,
            status: sessionData.status,
            host_id: sessionData.host_id,
            created_at: sessionData.created_at,
            expires_at: sessionData.expires_at,
            ...(sessionData.share_token && { share_token: sessionData.share_token }),
        };

        // Convert meals if they exist
        if (sessionData.meals) {
            session.meals = {};
            for (const [mealId, mealData] of Object.entries(sessionData.meals)) {
                session.meals[mealId] = {
                    id: mealId,
                    session_id: sessionId,
                    ...mealData,
                };
            }
        }

        // Copy votes if they exist
        if (sessionData.votes) {
            session.votes = sessionData.votes;
        }

        // Convert guests if they exist
        if (sessionData.guests) {
            session.guests = {};
            for (const [guestId, guestData] of Object.entries(sessionData.guests)) {
                session.guests[guestId] = {
                    id: guestId,
                    session_id: sessionId,
                    ...guestData,
                };
            }
        }

        return session;
    }

    /**
     * Update session
     * @param sessionId - Session ID
     * @param updates - Fields to update
     */
    async updateSession(sessionId: string, updates: Partial<FirebaseSessionData>): Promise<void> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        const updatedData = { ...sessionData, ...updates };
        sessions.set(sessionId, updatedData);
        console.log(`[MOCK FIREBASE] Updated session: ${sessionId}`, Object.keys(updates));

        // Emit change event
        this.emitSessionChange(sessionId);
    }

    /**
     * Delete session
     * @param sessionId - Session ID
     */
    async deleteSession(sessionId: string): Promise<void> {
        this.ensureInitialized();

        sessions.delete(sessionId);
        console.log(`[MOCK FIREBASE] Deleted session: ${sessionId}`);

        // Emit change event
        this.emitSessionChange(sessionId);
    }

    /**
     * Add meal to session
     * @param sessionId - Session ID
     * @param meal - Meal data
     */
    async addMealToSession(sessionId: string, meal: Omit<Meal, 'id' | 'session_id'>): Promise<string> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        const mealId = crypto.randomBytes(16).toString('hex');

        if (!sessionData.meals) {
            sessionData.meals = {};
        }

        sessionData.meals[mealId] = meal;
        sessions.set(sessionId, sessionData);
        console.log(`[MOCK FIREBASE] Added meal to session: ${sessionId}, meal: ${mealId}`);

        // Emit change event
        this.emitSessionChange(sessionId);

        return mealId;
    }

    /**
     * Get all meals for a session
     * @param sessionId - Session ID
     * @returns Array of meals
     */
    async getSessionMeals(sessionId: string): Promise<Meal[]> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        if (!sessionData.meals) {
            return [];
        }

        const meals = Object.keys(sessionData.meals).map((mealId) => ({
            id: mealId,
            session_id: sessionId,
            ...sessionData.meals![mealId],
        }));

        console.log(`[MOCK FIREBASE] Get session meals: ${sessionId}, count: ${meals.length}`);
        return meals;
    }

    /**
     * Record a vote
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @param mealId - Meal ID
     * @param voteType - Vote type (yes/no)
     */
    async recordVote(
        sessionId: string,
        guestId: string,
        mealId: string,
        voteType: VoteType
    ): Promise<void> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        if (!sessionData.votes) {
            sessionData.votes = {};
        }

        if (!sessionData.votes[guestId]) {
            sessionData.votes[guestId] = {};
        }

        sessionData.votes[guestId][mealId] = voteType;
        sessions.set(sessionId, sessionData);
        console.log(`[MOCK FIREBASE] Recorded vote: session=${sessionId}, guest=${guestId}, meal=${mealId}, vote=${voteType}`);

        // Emit change event
        this.emitSessionChange(sessionId);
    }

    /**
     * Get all votes for a session
     * @param sessionId - Session ID
     * @returns Votes object
     */
    async getSessionVotes(sessionId: string): Promise<{ [guestId: string]: { [mealId: string]: VoteType } }> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        console.log(`[MOCK FIREBASE] Get session votes: ${sessionId}`);
        return sessionData.votes || {};
    }

    /**
     * Get votes for a specific guest
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @returns Guest's votes
     */
    async getGuestVotes(sessionId: string, guestId: string): Promise<{ [mealId: string]: VoteType }> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        console.log(`[MOCK FIREBASE] Get guest votes: session=${sessionId}, guest=${guestId}`);
        return sessionData.votes?.[guestId] || {};
    }

    /**
     * Add guest to session
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @param guestName - Optional guest name
     */
    async addGuestToSession(sessionId: string, guestId: string, guestName?: string): Promise<void> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        if (!sessionData.guests) {
            sessionData.guests = {};
        }

        const guestData = {
            joined_at: Date.now(),
            has_voted: false,
            ...(guestName && { guest_name: guestName }),
        };

        sessionData.guests[guestId] = guestData;
        sessions.set(sessionId, sessionData);
        console.log(`[MOCK FIREBASE] Added guest to session: ${sessionId}, guest: ${guestId}`);

        // Emit change event
        this.emitSessionChange(sessionId);
    }

    /**
     * Update guest voting status
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @param hasVoted - Whether guest has completed voting
     */
    async updateGuestVotingStatus(sessionId: string, guestId: string, hasVoted: boolean): Promise<void> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        if (!sessionData.guests || !sessionData.guests[guestId]) {
            throw new NotFoundError('Guest not found in session');
        }

        sessionData.guests[guestId].has_voted = hasVoted;
        sessions.set(sessionId, sessionData);
        console.log(`[MOCK FIREBASE] Updated guest voting status: session=${sessionId}, guest=${guestId}, hasVoted=${hasVoted}`);

        // Emit change event
        this.emitSessionChange(sessionId);
    }

    /**
     * Get all guests for a session
     * @param sessionId - Session ID
     * @returns Array of guests
     */
    async getSessionGuests(sessionId: string): Promise<Guest[]> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        if (!sessionData.guests) {
            return [];
        }

        const guests = Object.keys(sessionData.guests).map((guestId) => ({
            id: guestId,
            session_id: sessionId,
            ...sessionData.guests![guestId],
        }));

        console.log(`[MOCK FIREBASE] Get session guests: ${sessionId}, count: ${guests.length}`);
        return guests;
    }

    /**
     * Set up real-time listener for session changes
     * @param sessionId - Session ID
     * @param callback - Callback function to handle changes
     * @returns Function to unsubscribe from listener
     */
    onSessionChange(sessionId: string, callback: (session: Session) => void): () => void {
        this.ensureInitialized();

        const eventName = `session:${sessionId}`;

        const listener = async () => {
            try {
                const session = await this.getSession(sessionId);
                callback(session);
            } catch (error) {
                // Session might have been deleted
                console.log(`[MOCK FIREBASE] Session ${sessionId} no longer exists`);
            }
        };

        eventEmitter.on(eventName, listener);
        console.log(`[MOCK FIREBASE] Registered listener for session: ${sessionId}`);

        // Return unsubscribe function
        return () => {
            eventEmitter.off(eventName, listener);
            console.log(`[MOCK FIREBASE] Unregistered listener for session: ${sessionId}`);
        };
    }

    /**
     * Emit session change event
     * @param sessionId - Session ID
     */
    private emitSessionChange(sessionId: string): void {
        const eventName = `session:${sessionId}`;
        eventEmitter.emit(eventName);
    }

    /**
     * Generate and store share token for session
     * @param sessionId - Session ID
     * @returns Share token
     */
    async generateShareToken(sessionId: string): Promise<string> {
        this.ensureInitialized();

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new NotFoundError('Session not found');
        }

        const token = crypto.randomBytes(16).toString('hex');

        sessionData.share_token = token;
        sessions.set(sessionId, sessionData);

        shareTokens.set(token, {
            session_id: sessionId,
            created_at: Date.now(),
        });

        console.log(`[MOCK FIREBASE] Generated share token for session: ${sessionId}`);

        // Emit change event
        this.emitSessionChange(sessionId);

        return token;
    }

    /**
     * Get session ID from share token
     * @param token - Share token
     * @returns Session ID
     */
    async getSessionIdFromToken(token: string): Promise<string> {
        this.ensureInitialized();

        const tokenData = shareTokens.get(token);
        if (!tokenData) {
            throw new NotFoundError('Invalid share token');
        }

        console.log(`[MOCK FIREBASE] Retrieved session ID from token: ${tokenData.session_id}`);
        return tokenData.session_id;
    }

    /**
     * Clear all data (useful for testing)
     */
    clearAllData(): void {
        users.clear();
        sessions.clear();
        shareTokens.clear();
        console.log('[MOCK FIREBASE] Cleared all data');
    }

    /**
     * Get data store stats (useful for debugging)
     */
    getStats(): { users: number; sessions: number; shareTokens: number } {
        return {
            users: users.size,
            sessions: sessions.size,
            shareTokens: shareTokens.size,
        };
    }
}

// Export singleton instance
export default new MockFirebaseService();

// Made with Bob