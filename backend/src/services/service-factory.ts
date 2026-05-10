/**
 * Service factory — picks real or mock implementations based on SERVICE_MODE.
 *
 * Routes import `dataService` and `aiService` from here and never touch the
 * underlying modules directly.
 *
 * Production guard: if we detect we're running on Vercel (or NODE_ENV is
 * production), we refuse to start in mock mode. This prevents a missing /
 * misspelled `SERVICE_MODE` env var from silently degrading auth to "any
 * email is accepted".
 */

import * as realSupabase from './supabase.service';
import * as mockSupabase from './mock/mock-supabase.service';

import * as realAi from './ai.service';
import * as mockAi from './mock/mock-ai.service';

type ServiceMode = 'mock' | 'test' | 'production';

const validModes: ServiceMode[] = ['mock', 'test', 'production'];
const raw = (process.env.SERVICE_MODE || '').trim().toLowerCase() as ServiceMode;
const onVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;
const isProdRuntime = process.env.NODE_ENV === 'production' || onVercel;

if (isProdRuntime && raw !== 'production' && raw !== 'test') {
    // Hard fail — never serve real users with mock auth.
    throw new Error(
        `[service-factory] Refusing to boot: SERVICE_MODE="${raw || '(unset)'}" ` +
            `in a production runtime (VERCEL=${process.env.VERCEL ?? '-'}, ` +
            `NODE_ENV=${process.env.NODE_ENV ?? '-'}). ` +
            `Set SERVICE_MODE=production explicitly.`
    );
}

if (raw && !validModes.includes(raw)) {
    console.warn(`[service-factory] invalid SERVICE_MODE "${raw}", defaulting to mock`);
}

const SERVICE_MODE: ServiceMode = validModes.includes(raw)
    ? raw
    : isProdRuntime
      ? 'production'
      : 'mock';

const USE_MOCK = SERVICE_MODE === 'mock';

/* ------------------------------------------------------------------ banner */
console.log('\n' + '='.repeat(72));
switch (SERVICE_MODE) {
    case 'mock':
        console.log('🧪 MOCK MODE — in-memory data, mock auth, no external services');
        console.log('   Pass `Authorization: Bearer mock:<email>` to act as a user.');
        break;
    case 'test':
        console.log('🔧 TEST MODE — real Supabase + OpenRouter + image providers');
        break;
    case 'production':
        console.log('🚀 PRODUCTION MODE — full external services');
        break;
}
console.log('='.repeat(72) + '\n');

/* ------------------------------------------------------------------ exports */

export const dataService = (USE_MOCK ? mockSupabase : realSupabase) as typeof realSupabase;
export const aiService = (USE_MOCK ? mockAi : realAi) as typeof realAi;

export const isUsingMockServices = USE_MOCK;
export const serviceMode: ServiceMode = SERVICE_MODE;

export function getServiceInfo() {
    return {
        mode: SERVICE_MODE,
        useMock: USE_MOCK,
        services: {
            data: USE_MOCK ? 'in-memory' : 'supabase',
            ai: USE_MOCK ? 'mock-templates' : 'openrouter+imagegen',
        },
    };
}

// Made with Bob
