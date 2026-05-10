/**
 * Pollinations.ai — free, no API key. Returns image bytes.
 */

import { ImageBytes } from './index';

const TIMEOUT_MS = 12_000;

function buildUrl(prompt: string): string {
    const params = new URLSearchParams({
        width: '1024',
        height: '1024',
        nologo: 'true',
        model: 'flux',
    });
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

export async function generatePollinationsImage(prompt: string): Promise<ImageBytes> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(buildUrl(prompt), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.byteLength === 0) throw new Error('empty body');
        return {
            bytes: buf,
            contentType: res.headers.get('content-type') ?? 'image/jpeg',
        };
    } finally {
        clearTimeout(timer);
    }
}

// Made with Bob
