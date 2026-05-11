/**
 * Supabase service — server-side admin client and DB helpers.
 *
 * Uses the service-role key, which bypasses RLS. All routes that should be
 * scoped to a particular user MUST verify the bearer token first
 * (see middleware/auth.middleware.ts) and pass the user id explicitly.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    MySession,
    Session,
    SessionMeal,
    SessionStatus,
    SessionWithMeals,
    VoteValue,
    ScaledIngredient,
} from '../types/session.types';
import { SavedMeal } from '../types/saved-meal.types';
import { isUuid } from '../utils/validation.util';
import { NotFoundError, InternalServerError } from '../utils/errors.util';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (client) return client;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new InternalServerError(
            'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (...args) => fetch(...args) },
    });
    return client;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function getUserFromAccessToken(accessToken: string) {
    const { data, error } = await getClient().auth.getUser(accessToken);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? '' };
}

/**
 * Permanently delete the auth.users row. Cascades to the profile (CASCADE on
 * profiles.id → auth.users.id), which cascades to sessions (CASCADE) — but
 * saved_meals.user_id uses ON DELETE SET NULL, so the recipes survive as an
 * anonymous corpus.
 */
export async function deleteAuthUser(userId: string): Promise<void> {
    const { error } = await getClient().auth.admin.deleteUser(userId);
    if (error) {
        throw new InternalServerError(`Failed to delete user: ${error.message}`);
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
    const { data, error } = await getClient()
        .from('sessions')
        .insert({
            host_id: input.host_id,
            vibe: input.vibe,
            headcount: input.headcount,
            dietary: input.dietary,
            status: 'generating' satisfies SessionStatus,
        })
        .select('*')
        .single();

    if (error || !data) {
        throw new InternalServerError(`Failed to create session: ${error?.message ?? 'unknown'}`);
    }
    return data as Session;
}

export async function updateSessionStatus(
    sessionId: string,
    status: SessionStatus
): Promise<void> {
    const { error } = await getClient()
        .from('sessions')
        .update({ status })
        .eq('id', sessionId);
    if (error) throw new InternalServerError(`Failed to update session status: ${error.message}`);
}

export async function getSessionWithMeals(sessionId: string): Promise<SessionWithMeals> {
    const supa = getClient();

    const { data: session, error: sErr } = await supa
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
    if (sErr || !session) throw new NotFoundError('Session not found');

    const { data: meals, error: mErr } = await supa
        .from('session_meals')
        .select('*')
        .eq('session_id', sessionId)
        .order('position', { ascending: true });
    if (mErr) throw new InternalServerError(`Failed to load meals: ${mErr.message}`);

    return { ...(session as Session), meals: (meals as SessionMeal[]) ?? [] };
}

export async function getSessionByShareToken(token: string): Promise<SessionWithMeals> {
    const supa = getClient();

    const { data: session, error: sErr } = await supa
        .from('sessions')
        .select('*')
        .eq('share_token', token)
        .single();
    if (sErr || !session) throw new NotFoundError('Session not found');

    return getSessionWithMeals((session as Session).id);
}

export async function deleteSessionMeals(sessionId: string): Promise<void> {
    const { error } = await getClient()
        .from('session_meals')
        .delete()
        .eq('session_id', sessionId);
    if (error) throw new InternalServerError(`Failed to clear meals: ${error.message}`);
}

export async function getSessionMealById(id: string): Promise<SessionMeal | null> {
    const { data, error } = await getClient()
        .from('session_meals')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) {
        throw new InternalServerError(`Failed to load session meal: ${error.message}`);
    }
    return (data as SessionMeal | null) ?? null;
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
    const rows = meals.map((m) => ({
        session_id: sessionId,
        source_saved_meal_id: m.source_saved_meal_id ?? null,
        title: m.title,
        description: m.description,
        image_url: m.image_url,
        ingredients: m.ingredients,
        instructions: m.instructions,
        position: m.position,
    }));

    const { data, error } = await getClient()
        .from('session_meals')
        .insert(rows)
        .select('*');

    if (error || !data) {
        throw new InternalServerError(`Failed to insert meals: ${error?.message ?? 'unknown'}`);
    }
    return data as SessionMeal[];
}

/* -------------------------------------------------------------------------- */
/* Guests + votes                                                             */
/* -------------------------------------------------------------------------- */

export async function ensureGuest(
    sessionId: string,
    userId: string | null = null
): Promise<{ id: string; guest_token: string }> {
    // Only pass userId if it's a valid UUID. Mock-mode IDs (mock-...) will be
    // correctly ignored here.
    const cleanUserId = userId && isUuid(userId) ? userId : null;

    console.log(`[supabase/ensureGuest] Minting guest for session ${sessionId} (user: ${cleanUserId})`);
    const { data, error } = await getClient().rpc('ensure_guest', {
        p_session_id: sessionId,
        p_user_id: cleanUserId,
    });
    if (error) {
        console.error(`[supabase/ensureGuest] RPC error:`, error);
        throw new InternalServerError(`Failed to mint guest: ${error.message}`);
    }
    if (!data || data.length === 0) {
        console.error(`[supabase/ensureGuest] No data returned from RPC`);
        throw new InternalServerError(`Failed to mint guest: no row returned`);
    }
    const row = data[0] as { id: string; guest_token: string };
    return { id: row.id, guest_token: row.guest_token };
}

export async function castVote(
    guestToken: string,
    sessionMealId: string,
    value: VoteValue
): Promise<void> {
    const { error } = await getClient().rpc('cast_vote', {
        p_guest_token: guestToken,
        p_meal_id: sessionMealId,
        p_value: value,
    });
    if (error) throw new InternalServerError(`Failed to cast vote: ${error.message}`);
}

/* -------------------------------------------------------------------------- */
/* Saved meals (My Food)                                                    */
/* -------------------------------------------------------------------------- */

export async function listSavedMeals(userId: string): Promise<SavedMeal[]> {
    const { data, error } = await getClient()
        .from('saved_meals')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) throw new InternalServerError(`Failed to list saved meals: ${error.message}`);
    return (data ?? []) as SavedMeal[];
}

export async function getSavedMealsByIds(
    userId: string,
    ids: string[]
): Promise<SavedMeal[]> {
    if (ids.length === 0) return [];
    const { data, error } = await getClient()
        .from('saved_meals')
        .select('*')
        .eq('user_id', userId)
        .in('id', ids);

    if (error) throw new InternalServerError(`Failed to load saved meals: ${error.message}`);
    return (data ?? []) as SavedMeal[];
}

export async function insertSavedMeal(input: {
    user_id: string;
    title: string;
    description: string;
    image_url: string | null;
    ingredients: ScaledIngredient[];
    instructions: string[];
}): Promise<SavedMeal> {
    const supa = getClient();

    // Compute the next position so this meal lands at the bottom.
    const { count } = await supa
        .from('saved_meals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', input.user_id);

    const { data, error } = await supa
        .from('saved_meals')
        .upsert(
            {
                user_id: input.user_id,
                title: input.title,
                description: input.description,
                image_url: input.image_url,
                ingredients: input.ingredients,
                instructions: input.instructions,
                position: count ?? 0,
            },
            { onConflict: 'user_id,title', ignoreDuplicates: false }
        )
        .select('*')
        .single();

    if (error || !data) {
        throw new InternalServerError(`Failed to save meal: ${error?.message ?? 'unknown'}`);
    }
    return data as SavedMeal;
}

/* -------------------------------------------------------------------------- */
/* Voting history (host's own sessions)                                       */
/* -------------------------------------------------------------------------- */

export async function getMySessions(userId: string): Promise<MySession[]> {
    const { data, error } = await getClient().rpc('list_my_sessions', {
        p_user_id: userId,
    });
    if (error) {
        throw new InternalServerError(`Failed to list sessions: ${error.message}`);
    }
    return (data ?? []) as MySession[];
}

export async function reorderSavedMeals(userId: string, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;

    // Per-row update; saved-meal collections are small (< 100 typically).
    const supa = getClient();
    for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supa
            .from('saved_meals')
            .update({ position: i })
            .eq('id', orderedIds[i])
            .eq('user_id', userId);
        if (error) {
            throw new InternalServerError(`Failed to reorder saved meals: ${error.message}`);
        }
    }
}

export async function deleteSavedMeal(userId: string, id: string): Promise<void> {
    const { error } = await getClient()
        .from('saved_meals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw new InternalServerError(`Failed to delete saved meal: ${error.message}`);
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

/**
 * Records the latest outcome for a probe-able service. Fire-and-forget — we
 * don't await results in hot paths; loss of a single record doesn't matter.
 */
export async function recordServiceOutcome(
    service: string,
    outcome: ServiceOutcome,
    message?: string
): Promise<void> {
    const { error } = await getClient().rpc('record_service_outcome', {
        p_service: service,
        p_outcome: outcome,
        p_message: message ?? null,
    });
    if (error) {
        // Never block app traffic on a status-record hiccup.
        console.warn('[recordServiceOutcome] failed:', error.message);
    }
}

export async function listServiceStatus(): Promise<ServiceStatusRow[]> {
    const { data, error } = await getClient()
        .from('service_status')
        .select('*');
    if (error) {
        console.warn('[listServiceStatus] failed:', error.message);
        return [];
    }
    return (data ?? []) as ServiceStatusRow[];
}

/* -------------------------------------------------------------------------- */
/* Anonymous events + error log (Phase B)                                     */
/* -------------------------------------------------------------------------- */

export type EventType = 'visit' | 'login' | 'new_user' | 'meal_generated' | 'meal_saved';

export async function recordEvent(input: {
    type: EventType;
    fingerprint?: string | null;
    user_id?: string | null;
    metadata?: Record<string, unknown> | null;
}): Promise<void> {
    const { error } = await getClient().rpc('record_event', {
        p_type: input.type,
        p_fingerprint: input.fingerprint ?? null,
        p_user_id: input.user_id ?? null,
        p_metadata: (input.metadata ?? null) as never,
    });
    if (error) console.warn('[recordEvent] failed:', error.message);
}

export async function recordError(source: string, message: string): Promise<void> {
    const { error } = await getClient().rpc('record_error', {
        p_source: source,
        p_message: message,
    });
    if (error) console.warn('[recordError] failed:', error.message);
}

export interface WeeklyDigestData {
    services: Array<{
        service: string;
        outcome: ServiceOutcome;
        last_attempt_at: string;
    }>;
    errors_count: number;
    errors: Array<{ source: string; message: string; ts: string }>;
    stats: Record<EventType, { week: number; month: number; total: number }>;
}

export async function getWeeklyDigestData(): Promise<WeeklyDigestData> {
    const { data, error } = await getClient().rpc('get_weekly_digest_data');
    if (error) {
        throw new InternalServerError(`Failed to build digest: ${error.message}`);
    }
    return data as WeeklyDigestData;
}

export async function cleanupAfterDigest(): Promise<void> {
    const { error } = await getClient().rpc('cleanup_after_digest');
    if (error) {
        throw new InternalServerError(`Failed to cleanup: ${error.message}`);
    }
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

export async function checkRate(
    actor: string,
    scope: string,
    max: number,
    windowSecs: number
): Promise<boolean> {
    const { data, error } = await getClient().rpc('check_rate', {
        p_actor: actor,
        p_scope: scope,
        p_max: max,
        p_window_secs: windowSecs,
    });
    if (error) {
        // Fail open — never block legitimate traffic on a Postgres hiccup.
        // Log loudly so we notice if it's persistent.
        console.error('[checkRate] RPC failed, allowing request:', error.message);
        return true;
    }
    return data === true;
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                    */
/* -------------------------------------------------------------------------- */

export async function uploadMealImage(
    path: string,
    bytes: Uint8Array,
    contentType = 'image/jpeg'
): Promise<string> {
    const supa = getClient();
    const uploadPromise = supa.storage
        .from('meal-images')
        .upload(path, bytes, { contentType, upsert: true });

    const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('uploadMealImage timed out after 15s')), 15000)
    );

    const { error } = await Promise.race([uploadPromise, timeoutPromise]);
    if (error) {
        throw new InternalServerError(`Failed to upload image: ${error.message}`);
    }
    const { data } = supa.storage.from('meal-images').getPublicUrl(path);
    return data.publicUrl;
}

// Made with Bob
