/**
 * Firebase Service
 * Handles all Firebase Realtime Database operations
 */

import admin from 'firebase-admin';
import {
    Session,
    SessionStatus,
    Meal,
    Vote,
    VoteType,
    Guest,
    FirebaseSessionData,
} from '../types/session.types';
import { User } from '../types/auth.types';
import { NotFoundError, InternalServerError } from '../utils/errors.util';

/**
 * Firebase Service class
 */
class FirebaseService {
    private db: admin.database.Database | null = null;
    private initialized: boolean = false;

    constructor() {
        this.initialize();
    }

    /**
     * Initialize Firebase Admin SDK
     */
    private initialize(): void {
        try {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

            if (!projectId || !privateKey || !clientEmail) {
                console.warn('Firebase credentials not configured. Database operations will fail.');
                return;
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    privateKey,
                    clientEmail,
                }),
                databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
            });

            this.db = admin.database();
            this.initialized = true;
            console.log('✅ Firebase service initialized');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }

    /**
     * Ensure Firebase is initialized
     */
    private ensureInitialized(): void {
        if (!this.initialized || !this.db) {
            throw new InternalServerError('Firebase service is not initialized');
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
        const userRef = this.db!.ref(`users/${userId}`);

        const snapshot = await userRef.once('value');
        const now = Date.now();

        if (snapshot.exists()) {
            // Update last login
            await userRef.update({ last_login: now });
            return {
                id: userId,
                email,
                created_at: snapshot.val().created_at,
                last_login: now,
            };
        } else {
            // Create new user
            const user: User = {
                id: userId,
                email,
                created_at: now,
                last_login: now,
            };
            await userRef.set({
                email,
                created_at: now,
                last_login: now,
            });
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

        const snapshot = await this.db!.ref(`users/${userId}`).once('value');
        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.val();
        return {
            id: userId,
            email: data.email,
            created_at: data.created_at,
            last_login: data.last_login,
        };
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

        const sessionId = this.db!.ref('sessions').push().key;
        if (!sessionId) {
            throw new InternalServerError('Failed to generate session ID');
        }

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

        await this.db!.ref(`sessions/${sessionId}`).set(sessionData);

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

        const snapshot = await this.db!.ref(`sessions/${sessionId}`).once('value');
        if (!snapshot.exists()) {
            throw new NotFoundError('Session not found');
        }

        const data = snapshot.val();
        return {
            id: sessionId,
            ...data,
        };
    }

    /**
     * Update session
     * @param sessionId - Session ID
     * @param updates - Fields to update
     */
    async updateSession(sessionId: string, updates: Partial<FirebaseSessionData>): Promise<void> {
        this.ensureInitialized();

        const sessionRef = this.db!.ref(`sessions/${sessionId}`);
        const snapshot = await sessionRef.once('value');

        if (!snapshot.exists()) {
            throw new NotFoundError('Session not found');
        }

        await sessionRef.update(updates);
    }

    /**
     * Delete session
     * @param sessionId - Session ID
     */
    async deleteSession(sessionId: string): Promise<void> {
        this.ensureInitialized();

        await this.db!.ref(`sessions/${sessionId}`).remove();
    }

    /**
     * Add meal to session
     * @param sessionId - Session ID
     * @param meal - Meal data
     */
    async addMealToSession(sessionId: string, meal: Omit<Meal, 'id' | 'session_id'>): Promise<string> {
        this.ensureInitialized();

        const mealId = this.db!.ref(`sessions/${sessionId}/meals`).push().key;
        if (!mealId) {
            throw new InternalServerError('Failed to generate meal ID');
        }

        await this.db!.ref(`sessions/${sessionId}/meals/${mealId}`).set(meal);
        return mealId;
    }

    /**
     * Get all meals for a session
     * @param sessionId - Session ID
     * @returns Array of meals
     */
    async getSessionMeals(sessionId: string): Promise<Meal[]> {
        this.ensureInitialized();

        const snapshot = await this.db!.ref(`sessions/${sessionId}/meals`).once('value');
        if (!snapshot.exists()) {
            return [];
        }

        const mealsData = snapshot.val();
        return Object.keys(mealsData).map((mealId) => ({
            id: mealId,
            session_id: sessionId,
            ...mealsData[mealId],
        }));
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

        await this.db!.ref(`sessions/${sessionId}/votes/${guestId}/${mealId}`).set(voteType);
    }

    /**
     * Get all votes for a session
     * @param sessionId - Session ID
     * @returns Votes object
     */
    async getSessionVotes(sessionId: string): Promise<{ [guestId: string]: { [mealId: string]: VoteType } }> {
        this.ensureInitialized();

        const snapshot = await this.db!.ref(`sessions/${sessionId}/votes`).once('value');
        if (!snapshot.exists()) {
            return {};
        }

        return snapshot.val();
    }

    /**
     * Get votes for a specific guest
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @returns Guest's votes
     */
    async getGuestVotes(sessionId: string, guestId: string): Promise<{ [mealId: string]: VoteType }> {
        this.ensureInitialized();

        const snapshot = await this.db!.ref(`sessions/${sessionId}/votes/${guestId}`).once('value');
        if (!snapshot.exists()) {
            return {};
        }

        return snapshot.val();
    }

    /**
     * Add guest to session
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @param guestName - Optional guest name
     */
    async addGuestToSession(sessionId: string, guestId: string, guestName?: string): Promise<void> {
        this.ensureInitialized();

        const guestData = {
            joined_at: Date.now(),
            has_voted: false,
            ...(guestName && { guest_name: guestName }),
        };

        await this.db!.ref(`sessions/${sessionId}/guests/${guestId}`).set(guestData);
    }

    /**
     * Update guest voting status
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @param hasVoted - Whether guest has completed voting
     */
    async updateGuestVotingStatus(sessionId: string, guestId: string, hasVoted: boolean): Promise<void> {
        this.ensureInitialized();

        await this.db!.ref(`sessions/${sessionId}/guests/${guestId}`).update({ has_voted: hasVoted });
    }

    /**
     * Get all guests for a session
     * @param sessionId - Session ID
     * @returns Array of guests
     */
    async getSessionGuests(sessionId: string): Promise<Guest[]> {
        this.ensureInitialized();

        const snapshot = await this.db!.ref(`sessions/${sessionId}/guests`).once('value');
        if (!snapshot.exists()) {
            return [];
        }

        const guestsData = snapshot.val();
        return Object.keys(guestsData).map((guestId) => ({
            id: guestId,
            session_id: sessionId,
            ...guestsData[guestId],
        }));
    }

    /**
     * Set up real-time listener for session changes
     * @param sessionId - Session ID
     * @param callback - Callback function to handle changes
     * @returns Function to unsubscribe from listener
     */
    onSessionChange(sessionId: string, callback: (session: Session) => void): () => void {
        this.ensureInitialized();

        const sessionRef = this.db!.ref(`sessions/${sessionId}`);
        const listener = sessionRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                callback({
                    id: sessionId,
                    ...snapshot.val(),
                });
            }
        });

        // Return unsubscribe function
        return () => {
            sessionRef.off('value', listener);
        };
    }

    /**
     * Generate and store share token for session
     * @param sessionId - Session ID
     * @returns Share token
     */
    async generateShareToken(sessionId: string): Promise<string> {
        this.ensureInitialized();

        const crypto = await import('crypto');
        const token = crypto.randomBytes(16).toString('hex');

        await this.db!.ref(`sessions/${sessionId}`).update({ share_token: token });
        await this.db!.ref(`share_tokens/${token}`).set({
            session_id: sessionId,
            created_at: Date.now(),
        });

        return token;
    }

    /**
     * Get session ID from share token
     * @param token - Share token
     * @returns Session ID
     */
    async getSessionIdFromToken(token: string): Promise<string> {
        this.ensureInitialized();

        const snapshot = await this.db!.ref(`share_tokens/${token}`).once('value');
        if (!snapshot.exists()) {
            throw new NotFoundError('Invalid share token');
        }

        return snapshot.val().session_id;
    }
}

// Export singleton instance
export default new FirebaseService();

// Made with Bob
