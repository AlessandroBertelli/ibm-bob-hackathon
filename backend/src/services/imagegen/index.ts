/**
 * Image generation orchestrator.
 *
 * Tries each provider listed in IMAGE_PROVIDERS in order. On any failure
 * (network, non-2xx, empty body, missing config, magic-byte sniff failure,
 * size cap exceeded) it rotates to the next. The first provider to return
 * legitimate image bytes wins; the bytes are uploaded to Supabase Storage
 * and the public URL is returned.
 *
 * Production hardening:
 *   • The Content-Type header from the provider is NOT trusted. We sniff the
 *     first bytes of the buffer and only persist files we recognise as JPEG,
 *     PNG, or WebP. This blocks SVG-with-script and JSON-error-payload smuggling.
 *   • Anything bigger than MAX_IMAGE_BYTES is rejected.
 *   • IMAGE_PROVIDERS must be set explicitly when running on Vercel /
 *     NODE_ENV=production. The dev default is "pollinations" so local work
 *     "just runs" without env config.
 *
 * If every provider fails, throws ServiceUnavailableError.
 */

import { uploadMealImage } from '../supabase.service';
import { ServiceUnavailableError, InternalServerError } from '../../utils/errors.util';
import { generatePollinationsImage } from './pollinations';
import { generateHuggingFaceImage } from './huggingface';
import { generateCloudflareImage } from './cloudflare';
// Single source of truth for magic-byte sniffing + the image-size cap.
// `api/_lib/safety.ts` re-exports these too for handler-side callers.
import { sniffImage, MAX_IMAGE_BYTES } from '../../utils/image.util';

export interface ImageBytes {
    bytes: Uint8Array;
    contentType: string;
}

export type ImageProvider = (prompt: string) => Promise<ImageBytes>;

const PROVIDERS: Record<string, ImageProvider> = {
    pollinations: generatePollinationsImage,
    huggingface: generateHuggingFaceImage,
    cloudflare: generateCloudflareImage,
};

const IS_PROD =
    process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.VERCEL_ENV;

function getProviders(): Array<{ name: string; provider: ImageProvider }> {
    const raw = (process.env.IMAGE_PROVIDERS || '').trim();

    if (!raw) {
        if (IS_PROD) {
            throw new InternalServerError(
                'IMAGE_PROVIDERS must be set in production. Recommended: pollinations,huggingface,cloudflare'
            );
        }
        // Dev convenience only.
        return [{ name: 'pollinations', provider: PROVIDERS.pollinations }];
    }

    const names = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return names
        .map((name) => {
            const provider = PROVIDERS[name];
            if (!provider) {
                console.warn(`[imagegen] unknown provider "${name}", skipping`);
                return null;
            }
            return { name, provider };
        })
        .filter((x): x is { name: string; provider: ImageProvider } => x !== null);
}

/**
 * Generate an image and persist it to the meal-images bucket.
 * Returns the public URL.
 */
export async function generateAndStoreMealImage(
    sessionId: string,
    mealKey: string,
    title: string,
    description: string
): Promise<string> {
    const prompt = `Professional food photography of ${title}. ${description}. Beautifully plated, appetizing, natural light, restaurant quality, overhead shot, vibrant colors.`;

    const providers = getProviders();
    if (providers.length === 0) {
        throw new ServiceUnavailableError(
            'No usable image providers configured.'
        );
    }

    const errors: string[] = [];
    let sawRateLimit = false;
    for (const { name, provider } of providers) {
        try {
            const { bytes } = await provider(prompt);

            if (bytes.byteLength === 0) throw new Error('empty body');
            if (bytes.byteLength > MAX_IMAGE_BYTES) {
                throw new Error(`image too large (${bytes.byteLength} bytes)`);
            }

            const sniff = sniffImage(bytes);
            if (!sniff.ok) {
                throw new Error(`not a recognised image: ${sniff.reason}`);
            }

            const ext = sniff.contentType.split('/')[1];
            const path = `${sessionId}/${mealKey}.${ext}`;
            const url = await uploadMealImage(path, bytes, sniff.contentType);

            if (errors.length > 0) {
                console.log(`[imagegen] ${name} succeeded after ${errors.length} fallthrough(s)`);
            }
            void recordOutcome('imagegen', 'ok');
            return url;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // Crude classifier — provider error messages include "429" or
            // "rate" when quota is exhausted.
            if (/\b429\b|rate/i.test(msg)) sawRateLimit = true;
            errors.push(`${name}: ${msg}`);
            console.warn(`[imagegen] ${name} failed; rotating: ${msg}`);
        }
    }

    const outcome = sawRateLimit ? 'rate_limited' : 'error';
    const summary = errors.join(' | ');
    void recordOutcome('imagegen', outcome, summary);
    if (outcome === 'error') {
        void recordError('imagegen', summary);
    }

    throw new ServiceUnavailableError(
        `All image providers exhausted:\n  ${errors.join('\n  ')}`
    );
}

async function recordOutcome(service: string, outcome: 'ok' | 'rate_limited' | 'error', message?: string) {
    try {
        const mod = await import('../service-factory');
        await mod.dataService.recordServiceOutcome(service, outcome, message);
    } catch (err) {
        console.warn('[recordOutcome] could not record:', (err as Error).message);
    }
}

async function recordError(source: string, message: string) {
    try {
        const mod = await import('../service-factory');
        await mod.dataService.recordError(source, message);
    } catch (err) {
        console.warn('[recordError] could not record:', (err as Error).message);
    }
}

// Made with Bob
