/**
 * Lightweight input validators. Throw ValidationError on bad input; return
 * normalised values on success.
 */

import { ValidationError } from './errors.util';
import { CreateSessionRequest, VoteValue } from '../types/session.types';
import { ReorderSavedMealsRequest } from '../types/saved-meal.types';

const ALLOWED_DIETARY = ['vegan', 'vegetarian', 'gluten-free', 'gluten_free', 'dairy-free', 'nut-free', 'halal', 'kosher'];
const MAX_PRESELECTED = 4;

export function isUuid(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    );
}

export function sanitizeString(input: unknown, max = 500): string {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

export function validateCreateSession(body: unknown): Required<
    Pick<CreateSessionRequest, 'vibe' | 'headcount' | 'dietary'>
> & { selected_saved_meal_ids: string[] } {
    if (!body || typeof body !== 'object') {
        throw new ValidationError('Request body required');
    }
    const b = body as Record<string, unknown>;

    const vibe = sanitizeString(b.vibe, 100);
    if (vibe.length < 3) throw new ValidationError('vibe must be at least 3 characters');

    const headcount = Number(b.headcount);
    if (!Number.isInteger(headcount) || headcount < 2 || headcount > 20) {
        throw new ValidationError('headcount must be an integer between 2 and 20');
    }

    const dietaryRaw = Array.isArray(b.dietary) ? b.dietary : [];
    const dietary = dietaryRaw
        .map((x) => sanitizeString(x, 30).toLowerCase())
        .filter((x) => ALLOWED_DIETARY.includes(x));

    const selectedRaw = Array.isArray(b.selected_saved_meal_ids) ? b.selected_saved_meal_ids : [];
    if (selectedRaw.length > MAX_PRESELECTED) {
        throw new ValidationError(`At most ${MAX_PRESELECTED} pre-selected meals allowed`);
    }
    const selected_saved_meal_ids = selectedRaw.filter(isUuid) as string[];
    if (selected_saved_meal_ids.length !== selectedRaw.length) {
        throw new ValidationError('selected_saved_meal_ids contains an invalid id');
    }

    return { vibe, headcount, dietary, selected_saved_meal_ids };
}

export function validateCastVote(body: unknown): {
    guest_token: string;
    session_meal_id: string;
    value: VoteValue;
} {
    if (!body || typeof body !== 'object') throw new ValidationError('Request body required');
    const b = body as Record<string, unknown>;

    const guest_token = sanitizeString(b.guest_token, 64);
    const session_meal_id = sanitizeString(b.session_meal_id, 64);
    const valueRaw = sanitizeString(b.value, 8).toLowerCase();

    if (!guest_token) throw new ValidationError('guest_token required');
    if (!isUuid(session_meal_id)) throw new ValidationError('session_meal_id must be a UUID');
    if (valueRaw !== 'yes' && valueRaw !== 'no') {
        throw new ValidationError('value must be "yes" or "no"');
    }
    return { guest_token, session_meal_id, value: valueRaw as VoteValue };
}

export function validateMintGuest(body: unknown): { session_id: string } {
    if (!body || typeof body !== 'object') throw new ValidationError('Request body required');
    const b = body as Record<string, unknown>;
    const session_id = sanitizeString(b.session_id, 64);
    if (!isUuid(session_id)) throw new ValidationError('session_id must be a UUID');
    return { session_id };
}

/**
 * The only field the client supplies is `source_session_meal_id`. Title,
 * description, ingredients and image_url are derived server-side from the
 * referenced session_meal so users can't:
 *   • host-spoof image URLs to tracking pixels,
 *   • inject arbitrary HTML/text into their saved collection,
 *   • bloat Postgres jsonb with gigantic ingredient arrays.
 */
export function validateCreateSavedMeal(body: unknown): { source_session_meal_id: string } {
    if (!body || typeof body !== 'object') throw new ValidationError('Request body required');
    const b = body as Record<string, unknown>;

    const source_session_meal_id =
        typeof b.source_session_meal_id === 'string' && isUuid(b.source_session_meal_id)
            ? b.source_session_meal_id
            : null;

    if (!source_session_meal_id) {
        throw new ValidationError('source_session_meal_id required (must be a UUID)');
    }
    return { source_session_meal_id };
}

// Hard cap on a single reorder payload. Saved-meal collections are tiny in
// practice (< 100 entries), but the bulk-reorder endpoint runs an UPDATE per
// entry. Without a cap, a malicious payload of N×10⁴ UUIDs would cost N×10⁴
// sequential round-trips. 500 is comfortably above any real user's library.
const MAX_REORDER_IDS = 500;

export function validateReorderSavedMeals(body: unknown): ReorderSavedMealsRequest {
    if (!body || typeof body !== 'object') throw new ValidationError('Request body required');
    const b = body as Record<string, unknown>;
    const list = Array.isArray(b.ordered_ids) ? b.ordered_ids : [];
    if (list.length > MAX_REORDER_IDS) {
        throw new ValidationError(`ordered_ids may contain at most ${MAX_REORDER_IDS} entries`);
    }
    const ordered_ids = list.filter(isUuid) as string[];
    if (ordered_ids.length !== list.length) {
        throw new ValidationError('ordered_ids contains an invalid id');
    }
    return { ordered_ids };
}

// Made with Bob
