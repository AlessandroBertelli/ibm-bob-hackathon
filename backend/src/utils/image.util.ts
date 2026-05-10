/**
 * Image-handling primitives shared between the imagegen orchestrator and the
 * api/_lib safety layer. Single source of truth for magic-byte sniffing and
 * the size cap so a future format addition (AVIF, etc.) only needs adding in
 * one place.
 *
 * Convention: api/ imports from backend/, never the reverse — this file lives
 * in backend/src/utils/ so both call sites can import without inverting that.
 */

export type SniffResult =
    | { ok: true; contentType: 'image/jpeg' | 'image/png' | 'image/webp' }
    | { ok: false; reason: string };

/**
 * Sniff the first few bytes of a buffer and return its image type if
 * recognised. Used instead of trusting a remote provider's Content-Type
 * header before persisting bytes to public storage — defends against
 * SVG-with-script smuggling and JSON-error-payload bait.
 */
export function sniffImage(bytes: Uint8Array): SniffResult {
    if (bytes.length < 12) return { ok: false, reason: 'too short' };
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return { ok: true, contentType: 'image/jpeg' };
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
    ) {
        return { ok: true, contentType: 'image/png' };
    }
    // WEBP: "RIFF" .... "WEBP"
    if (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
    ) {
        return { ok: true, contentType: 'image/webp' };
    }
    return { ok: false, reason: 'unrecognised magic bytes' };
}

// 5 MB — well above any image our generators emit, well below Storage limits.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Made with Bob
