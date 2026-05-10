/**
 * Cloudflare Workers AI — @cf/black-forest-labs/flux-1-schnell.
 *
 * Free tier on Cloudflare's free plan: 10,000 neurons/day. FLUX-1-schnell
 * costs ~3 neurons per image (≈3,300 images/day). Plenty for hackathon scale.
 *
 * Required env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN.
 * The token only needs the "Workers AI" permission.
 *
 * The endpoint returns JSON: { result: { image: <base64-encoded jpeg> }, success, errors }.
 */

import { ImageBytes } from './index';

const TIMEOUT_MS = 50_000;
const MODEL = '@cf/black-forest-labs/flux-1-schnell';

export async function generateCloudflareImage(prompt: string): Promise<ImageBytes> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not set');
    if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN not set');

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, steps: 4 }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${txt.substring(0, 160)}`);
        }

        const json = (await res.json()) as {
            success?: boolean;
            errors?: Array<{ message: string }>;
            result?: { image?: string };
        };

        if (!json.success) {
            const msg = json.errors?.map((e) => e.message).join('; ') || 'unknown';
            throw new Error(`API error: ${msg}`);
        }
        const b64 = json.result?.image;
        if (!b64) throw new Error('no image in response');

        const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
        if (bytes.byteLength === 0) throw new Error('empty image');
        return { bytes, contentType: 'image/jpeg' };
    } finally {
        clearTimeout(timer);
    }
}

// Made with Bob
