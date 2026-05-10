/**
 * Small, dependency-free safety helpers shared across handlers.
 *
 * Image-byte sniffing and the size cap live in `backend/src/utils/image.util`
 * (single source of truth; both this layer and the imagegen orchestrator
 * import it). They're re-exported here for handlers that already pull from
 * `_lib/safety`.
 */

import { ValidationError } from '../../backend/src/utils/errors.util';
export { sniffImage, MAX_IMAGE_BYTES } from '../../backend/src/utils/image.util';
export type { SniffResult } from '../../backend/src/utils/image.util';

const MAX_BODY_BYTES = 100_000; // 100 KB — generous for our largest legit payload (saved meal with ~50 ingredients)

/**
 * Reject requests claiming an oversized body. This is one layer of a stacked
 * defence:
 *
 *   1. Vercel's Node.js runtime hard-caps incoming bodies at 4.5 MB. We can't
 *      raise or lower that — it's a platform fact.
 *   2. `enforceBodyLimit` (this function) inspects the `Content-Length` header
 *      *before* we touch auth or DB, so an oversized declared body fails fast
 *      with a 400 instead of being parsed and then rejected downstream.
 *   3. Per-handler validators cap individual fields (vibe ≤ 200 chars, ids
 *      array ≤ 500, etc.) so even a within-100-KB body that smuggles a giant
 *      single field is bounded.
 *
 * Limit (2) is best-effort: a request with `Transfer-Encoding: chunked` and no
 * `Content-Length` slips past this check and relies on (1) + (3). Vercel's
 * 4.5 MB platform cap means the worst case is "we parsed up to 4.5 MB before
 * the validator threw" which is still bounded.
 */
export function enforceBodyLimit(headers: Record<string, string | string[] | undefined>): void {
    const raw = headers['content-length'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (n > MAX_BODY_BYTES) {
        throw new ValidationError(`Payload too large (max ${MAX_BODY_BYTES} bytes)`);
    }
}

/**
 * Validate a `redirect_to` value before passing it to navigate().
 * Accept only same-origin paths starting with a single "/", reject
 * protocol-relative ("//evil.com"), absolute URLs, javascript: / data: URIs.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
    if (typeof raw !== 'string') return fallback;
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    if (!trimmed.startsWith('/')) return fallback;
    if (trimmed.startsWith('//')) return fallback;
    if (/^\/\\/.test(trimmed)) return fallback; // /\evil.com pattern
    if (trimmed.toLowerCase().startsWith('/javascript:')) return fallback;
    return trimmed;
}

// Made with Bob
