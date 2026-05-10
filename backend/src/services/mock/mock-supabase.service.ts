/**
 * Mock Supabase service. Same surface as services/supabase.service.ts but
 * backed by in-memory maps. Lets the backend boot and operate without any
 * Supabase project at all.
 *
 * Auth: any bearer token of the form `mock:<email>` is accepted. The backend
 * derives a stable UUID per email so foreign keys keep working across requests.
 */

import { randomUUID, createHash } from 'crypto';
import {
    MySession,
    Session,
    SessionMeal,
    SessionStatus,
    SessionWithMeals,
    VoteValue,
    ScaledIngredient,
} from '../../types/session.types';
import { SavedMeal } from '../../types/saved-meal.types';
import { NotFoundError } from '../../utils/errors.util';

interface MockGuest {
    id: string;
    session_id: string;
    user_id: string | null;
    guest_token: string;
}

const profiles = new Map<string, { id: string; email: string }>();
const sessions = new Map<string, Session>();
const sessionMeals = new Map<string, SessionMeal>();
const guestsById = new Map<string, MockGuest>();
const guestsByToken = new Map<string, MockGuest>();
const votes = new Map<string, VoteValue>(); // key: `${guest_id}|${meal_id}`
const savedMeals = new Map<string, SavedMeal>();

function uuidFromEmail(email: string): string {
    // Deterministic v4-ish UUID so (token → user) is stable between calls.
    const h = createHash('sha1').update(email).digest('hex');
    return [
        h.slice(0, 8),
        h.slice(8, 12),
        '4' + h.slice(13, 16),
        '8' + h.slice(17, 20),
        h.slice(20, 32),
    ].join('-');
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function getUserFromAccessToken(accessToken: string) {
    if (!accessToken.startsWith('mock:')) return null;
    const email = accessToken.slice(5).trim().toLowerCase();
    if (!email) return null;
    const id = uuidFromEmail(email);
    if (!profiles.has(id)) profiles.set(id, { id, email });
    return profiles.get(id)!;
}

export async function deleteAuthUser(userId: string): Promise<void> {
    profiles.delete(userId);
    // Drop sessions hosted by this user (cascades to session_meals).
    for (const [id, s] of sessions) {
        if (s.host_id === userId) {
            sessions.delete(id);
            for (const [mid, m] of sessionMeals) {
                if (m.session_id === id) sessionMeals.delete(mid);
            }
        }
    }
    // Saved meals: orphan them (mirror SET NULL behaviour).
    for (const m of savedMeals.values()) {
        if (m.user_id === userId) {
            (m as { user_id: string | null }).user_id = null;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export async function createSession(input: {
    host_id: string;
    vibe: string;
    headcount: number;
    dietary: string[];
}): Promise<Session> {
    const now = new Date();
    const session: Session = {
        id: randomUUID(),
        host_id: input.host_id,
        vibe: input.vibe,
        headcount: input.headcount,
        dietary: input.dietary,
        share_token: randomUUID().replace(/-/g, ''),
        status: 'generating' satisfies SessionStatus,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
    };
    sessions.set(session.id, session);
    return session;
}

export async function updateSessionStatus(
    sessionId: string,
    status: SessionStatus
): Promise<void> {
    const s = sessions.get(sessionId);
    if (!s) throw new NotFoundError('Session not found');
    s.status = status;
}

export async function getSessionWithMeals(sessionId: string): Promise<SessionWithMeals> {
    const s = sessions.get(sessionId);
    if (!s) throw new NotFoundError('Session not found');
    const meals = [...sessionMeals.values()]
        .filter((m) => m.session_id === sessionId)
        .sort((a, b) => a.position - b.position);
    return { ...s, meals };
}

export async function getSessionByShareToken(token: string): Promise<SessionWithMeals> {
    const s = [...sessions.values()].find((x) => x.share_token === token);
    if (!s) throw new NotFoundError('Session not found');
    return getSessionWithMeals(s.id);
}

export async function deleteSessionMeals(sessionId: string): Promise<void> {
    for (const [id, m] of sessionMeals) {
        if (m.session_id === sessionId) sessionMeals.delete(id);
    }
}

export async function getSessionMealById(id: string): Promise<SessionMeal | null> {
    return sessionMeals.get(id) ?? null;
}

export async function insertSessionMeals(
    sessionId: string,
    meals: Array<{
        title: string;
        description: string;
        image_url: string | null;
        ingredients: ScaledIngredient[];
        instructions: string[];
        position: number;
        source_saved_meal_id?: string | null;
    }>
): Promise<SessionMeal[]> {
    const inserted: SessionMeal[] = meals.map((m) => {
        const row: SessionMeal = {
            id: randomUUID(),
            session_id: sessionId,
            source_saved_meal_id: m.source_saved_meal_id ?? null,
            title: m.title,
            description: m.description,
            image_url: m.image_url,
            ingredients: m.ingredients,
            instructions: m.instructions,
            position: m.position,
            yes_count: 0,
            no_count: 0,
            created_at: new Date().toISOString(),
        };
        sessionMeals.set(row.id, row);
        return row;
    });
    return inserted;
}

/* -------------------------------------------------------------------------- */
/* Guests + votes                                                             */
/* -------------------------------------------------------------------------- */

export async function ensureGuest(
    sessionId: string,
    userId: string | null = null
): Promise<{ id: string; guest_token: string }> {
    const guest: MockGuest = {
        id: randomUUID(),
        session_id: sessionId,
        user_id: userId,
        guest_token: randomUUID().replace(/-/g, ''),
    };
    guestsById.set(guest.id, guest);
    guestsByToken.set(guest.guest_token, guest);
    return { id: guest.id, guest_token: guest.guest_token };
}

export async function castVote(
    guestToken: string,
    sessionMealId: string,
    value: VoteValue
): Promise<void> {
    const guest = guestsByToken.get(guestToken);
    if (!guest) throw new NotFoundError('invalid_guest_token');

    const meal = sessionMeals.get(sessionMealId);
    if (!meal || meal.session_id !== guest.session_id) {
        throw new NotFoundError('meal_not_in_session');
    }

    const key = `${guest.id}|${sessionMealId}`;
    if (votes.has(key)) return; // idempotent — match the SQL ON CONFLICT
    votes.set(key, value);

    if (value === 'yes') meal.yes_count++;
    else meal.no_count++;
}

/* -------------------------------------------------------------------------- */
/* Saved meals                                                                */
/* -------------------------------------------------------------------------- */

export async function listSavedMeals(userId: string): Promise<SavedMeal[]> {
    return [...savedMeals.values()]
        .filter((m) => m.user_id === userId)
        .sort((a, b) => a.position - b.position);
}

export async function getSavedMealsByIds(
    userId: string,
    ids: string[]
): Promise<SavedMeal[]> {
    return [...savedMeals.values()].filter(
        (m) => m.user_id === userId && ids.includes(m.id)
    );
}

export async function insertSavedMeal(input: {
    user_id: string;
    title: string;
    description: string;
    image_url: string | null;
    ingredients: ScaledIngredient[];
    instructions: string[];
}): Promise<SavedMeal> {
    // Honour the (user_id, title) uniqueness constraint.
    const existing = [...savedMeals.values()].find(
        (m) => m.user_id === input.user_id && m.title === input.title
    );
    if (existing) {
        existing.description = input.description;
        existing.image_url = input.image_url;
        existing.ingredients = input.ingredients;
        existing.instructions = input.instructions;
        return existing;
    }

    const position = [...savedMeals.values()].filter(
        (m) => m.user_id === input.user_id
    ).length;
    const row: SavedMeal = {
        id: randomUUID(),
        user_id: input.user_id,
        title: input.title,
        description: input.description,
        image_url: input.image_url,
        ingredients: input.ingredients,
        instructions: input.instructions,
        position,
        created_at: new Date().toISOString(),
    };
    savedMeals.set(row.id, row);
    return row;
}

export async function reorderSavedMeals(userId: string, orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, i) => {
        const m = savedMeals.get(id);
        if (m && m.user_id === userId) m.position = i;
    });
}

export async function deleteSavedMeal(userId: string, id: string): Promise<void> {
    const m = savedMeals.get(id);
    if (m && m.user_id === userId) savedMeals.delete(id);
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                    */
/* -------------------------------------------------------------------------- */

export async function uploadMealImage(
    path: string,
    _bytes: Uint8Array,
    _contentType?: string
): Promise<string> {
    // No actual storage in mock mode — return a deterministic placeholder.
    return `https://picsum.photos/seed/${encodeURIComponent(path)}/1024/1024`;
}

/* -------------------------------------------------------------------------- */
/* Voting history                                                              */
/* -------------------------------------------------------------------------- */

export async function getMySessions(userId: string): Promise<MySession[]> {
    const mySessions = [...sessions.values()]
        .filter((s) => s.host_id === userId)
        .sort((a, b) => (b.created_at < a.created_at ? -1 : 1));

    return mySessions.map((s) => {
        const sessionMealIds = new Set(
            [...sessionMeals.values()].filter((m) => m.session_id === s.id).map((m) => m.id)
        );
        const voters = new Set<string>();
        for (const key of votes.keys()) {
            const [guestId, mealId] = key.split('|');
            if (sessionMealIds.has(mealId)) voters.add(guestId);
        }
        return {
            id: s.id,
            vibe: s.vibe,
            headcount: s.headcount,
            dietary: s.dietary,
            share_token: s.share_token,
            status: s.status,
            created_at: s.created_at,
            expires_at: s.expires_at,
            voter_count: voters.size,
        };
    });
}

/* -------------------------------------------------------------------------- */
/* Rate limiting (no-op in mock mode)                                          */
/* -------------------------------------------------------------------------- */

export async function checkRate(
    _actor: string,
    _scope: string,
    _max: number,
    _windowSecs: number
): Promise<boolean> {
    // Mock mode never throttles — local development would otherwise be painful.
    return true;
}

/* -------------------------------------------------------------------------- */
/* Service status                                                             */
/* -------------------------------------------------------------------------- */

export type ServiceOutcome = 'ok' | 'rate_limited' | 'error';

export interface ServiceStatusRow {
    service: string;
    outcome: ServiceOutcome;
    message: string | null;
    last_attempt_at: string;
}

const statusBoard = new Map<string, ServiceStatusRow>();

export async function recordServiceOutcome(
    service: string,
    outcome: ServiceOutcome,
    message?: string
): Promise<void> {
    statusBoard.set(service, {
        service,
        outcome,
        message: message ?? null,
        last_attempt_at: new Date().toISOString(),
    });
}

export async function listServiceStatus(): Promise<ServiceStatusRow[]> {
    return [...statusBoard.values()];
}

/* -------------------------------------------------------------------------- */
/* Anonymous events + error log (Phase B) — in-memory                         */
/* -------------------------------------------------------------------------- */

export type EventType = 'visit' | 'login' | 'new_user' | 'meal_generated' | 'meal_saved';

interface MockEvent {
    type: EventType;
    fingerprint: string | null;
    user_id: string | null;
    metadata: Record<string, unknown> | null;
    ts: string;
}

const eventLog: MockEvent[] = [];
const totalCounters: Record<EventType, number> = {
    visit: 0,
    login: 0,
    new_user: 0,
    meal_generated: 0,
    meal_saved: 0,
};
const errorLog: Array<{ source: string; message: string; ts: string }> = [];

export async function recordEvent(input: {
    type: EventType;
    fingerprint?: string | null;
    user_id?: string | null;
    metadata?: Record<string, unknown> | null;
}): Promise<void> {
    eventLog.push({
        type: input.type,
        fingerprint: input.fingerprint ?? null,
        user_id: input.user_id ?? null,
        metadata: input.metadata ?? null,
        ts: new Date().toISOString(),
    });
    totalCounters[input.type]++;
}

export async function recordError(source: string, message: string): Promise<void> {
    errorLog.push({ source, message: message.slice(0, 1000), ts: new Date().toISOString() });
}

export interface WeeklyDigestData {
    services: Array<{ service: string; outcome: ServiceOutcome; last_attempt_at: string }>;
    errors_count: number;
    errors: Array<{ source: string; message: string; ts: string }>;
    stats: Record<EventType, { week: number; month: number; total: number }>;
}

export async function getWeeklyDigestData(): Promise<WeeklyDigestData> {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const week = now - 7 * dayMs;
    const month = now - 30 * dayMs;

    const stats = (Object.keys(totalCounters) as EventType[]).reduce(
        (acc, t) => {
            acc[t] = {
                week: eventLog.filter((e) => e.type === t && new Date(e.ts).getTime() > week).length,
                month: eventLog.filter((e) => e.type === t && new Date(e.ts).getTime() > month).length,
                total: totalCounters[t],
            };
            return acc;
        },
        {} as Record<EventType, { week: number; month: number; total: number }>
    );

    return {
        services: [...statusBoard.values()].map((r) => ({
            service: r.service,
            outcome: r.outcome,
            last_attempt_at: r.last_attempt_at,
        })),
        errors_count: errorLog.length,
        errors: [...errorLog].sort((a, b) => (a.ts < b.ts ? 1 : -1)),
        stats,
    };
}

export async function cleanupAfterDigest(): Promise<void> {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (let i = eventLog.length - 1; i >= 0; i--) {
        if (new Date(eventLog[i].ts).getTime() < cutoff) eventLog.splice(i, 1);
    }
    errorLog.length = 0;
}

// Made with Bob
