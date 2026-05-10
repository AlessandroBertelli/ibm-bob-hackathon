/**
 * OpenRouter chat completion with automatic model rotation.
 *
 * On any of: rate limit (429), 5xx, fetch failure, request timeout, or empty
 * content, we move on to the next model in OPENROUTER_MODELS. When the list is
 * exhausted we throw a 503.
 */

import { ChatMessage } from '../types/ai.types';
import { ServiceUnavailableError, InternalServerError } from '../utils/errors.util';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 30_000;

interface ChatOptions {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    /** If true, ask the LLM to return JSON. Some free models ignore this. */
    json?: boolean;
}

interface ChatResult {
    content: string;
    model: string;
}

function getModels(): string[] {
    const raw = process.env.OPENROUTER_MODELS ?? '';
    const list = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (list.length === 0) {
        throw new InternalServerError(
            'OPENROUTER_MODELS is empty. Set it to a comma-separated list of model slugs.'
        );
    }
    return list;
}

function getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        throw new InternalServerError('OPENROUTER_API_KEY is not set.');
    }
    return key;
}

function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
}

async function callOnce(model: string, opts: ChatOptions): Promise<ChatResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
        };
        if (process.env.OPENROUTER_REFERER) headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER;
        if (process.env.OPENROUTER_APP_NAME) headers['X-Title'] = process.env.OPENROUTER_APP_NAME;

        const body: Record<string, unknown> = {
            model,
            messages: opts.messages,
            temperature: opts.temperature ?? 0.8,
            max_tokens: opts.max_tokens ?? 2048,
        };
        if (opts.json) {
            body.response_format = { type: 'json_object' };
        }

        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            const err = new Error(`OpenRouter ${res.status}: ${text.substring(0, 240)}`) as Error & {
                status: number;
            };
            err.status = res.status;
            throw err;
        }

        const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };

        const content = data.choices?.[0]?.message?.content ?? '';
        if (!content.trim()) {
            const err = new Error(`Empty response from ${model}`) as Error & { status: number };
            err.status = 502;
            throw err;
        }
        return { content, model };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Try each model in order; return on first success. Throws ServiceUnavailable
 * if every model fails.
 *
 * Records the outcome to `service_status` after each attempt so the landing
 * page indicator shows the most recent real-user state:
 *   • ok           — at least one model returned content
 *   • rate_limited — every attempted model hit 429 (all quotas exhausted)
 *   • error        — every attempted model failed for non-rate-limit reasons
 */
export async function chat(opts: ChatOptions): Promise<ChatResult> {
    const models = getModels();
    const errors: string[] = [];
    let saw429 = false;
    let saw5xx = false;

    for (const model of models) {
        try {
            const result = await callOnce(model, opts);
            if (errors.length > 0) {
                console.log(
                    `[openrouter] ${model} succeeded after ${errors.length} fallthrough(s)`
                );
            }
            void recordOutcome('openrouter', 'ok');
            return result;
        } catch (err) {
            const e = err as Error & { status?: number; name?: string };
            const status = e.status ?? 0;
            const isAbort = e.name === 'AbortError';
            const retryable = isAbort || status === 0 || isRetryableStatus(status);
            if (status === 429) saw429 = true;
            else saw5xx = true;
            errors.push(`${model} → ${isAbort ? 'timeout' : status || 'network'}: ${e.message}`);

            if (!retryable) {
                // Non-retryable (e.g. 400 invalid request) — stop trying.
                void recordOutcome('openrouter', 'error', e.message);
                throw new InternalServerError(`OpenRouter rejected request: ${e.message}`);
            }
            console.warn(`[openrouter] ${model} failed (${isAbort ? 'timeout' : status}); rotating`);
        }
    }

    // All models failed.
    const outcome = saw429 && !saw5xx ? 'rate_limited' : 'error';
    const summary = errors.join(' | ');
    void recordOutcome('openrouter', outcome, summary);
    if (outcome === 'error') {
        void recordError('openrouter', summary);
    }

    throw new ServiceUnavailableError(
        `All OpenRouter models exhausted:\n  ${errors.join('\n  ')}`
    );
}

// Lazy-import to avoid a circular type chain (this file is imported by the
// service-factory; importing the factory back would self-reference).
async function recordOutcome(service: string, outcome: 'ok' | 'rate_limited' | 'error', message?: string) {
    try {
        const mod = await import('./service-factory');
        await mod.dataService.recordServiceOutcome(service, outcome, message);
    } catch (err) {
        console.warn('[recordOutcome] could not record:', (err as Error).message);
    }
}

async function recordError(source: string, message: string) {
    try {
        const mod = await import('./service-factory');
        await mod.dataService.recordError(source, message);
    } catch (err) {
        console.warn('[recordError] could not record:', (err as Error).message);
    }
}

// Made with Bob
