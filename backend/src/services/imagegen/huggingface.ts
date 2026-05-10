/**
 * Hugging Face Inference API — black-forest-labs/FLUX.1-schnell.
 * Free with a HF token (https://huggingface.co/settings/tokens).
 *
 * Note: shared inference for FLUX.1-schnell can return 503 when the model
 * is "loading". We surface that as a normal failure so the orchestrator
 * rotates to the next provider.
 */

import { ImageBytes } from './index';

const ENDPOINT =
    'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';
const TIMEOUT_MS = 50_000;

export async function generateHuggingFaceImage(prompt: string): Promise<ImageBytes> {
    const token = process.env.HUGGINGFACE_API_TOKEN;
    if (!token) throw new Error('HUGGINGFACE_API_TOKEN not set');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'image/png',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { width: 1024, height: 1024 },
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${txt.substring(0, 160)}`);
        }

        const ct = res.headers.get('content-type') ?? '';
        if (!ct.startsWith('image/')) {
            // Some HF errors come back as JSON with 200 status.
            const txt = await res.text().catch(() => '');
            throw new Error(`unexpected content-type "${ct}": ${txt.substring(0, 160)}`);
        }

        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.byteLength === 0) throw new Error('empty body');
        return { bytes: buf, contentType: ct };
    } finally {
        clearTimeout(timer);
    }
}

// Made with Bob
