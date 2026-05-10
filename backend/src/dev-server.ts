/**
 * Local development server.
 *
 * Loads every Vercel-style handler from `api/` and mounts it on an Express
 * router. Handlers ship to production verbatim; this file exists only so we
 * don't have to install the Vercel CLI just to develop locally.
 *
 * Routing semantics intentionally match Vercel's filesystem router:
 *   - api/foo.ts          → /api/foo
 *   - api/foo/index.ts    → /api/foo
 *   - api/foo/[id].ts     → /api/foo/:id
 *   - api/foo/[id]/bar.ts → /api/foo/:id/bar
 * Subdirectories starting with `_` are skipped (helpers).
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { readdirSync, statSync } from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { isUsingMockServices, serviceMode } from './services/service-factory';

const PORT = Number(process.env.PORT || 3000);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_DIR = path.resolve(__dirname, '../../api');

const app = express();
app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    })
);
// Match the production cap (api/_lib/safety.ts MAX_BODY_BYTES = 100 KB) so
// behaviour parity holds between dev and prod — a payload that 413s on
// Vercel must also 413 in dev, otherwise we ship surprises.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

type Discovered = { route: string; handler: (req: Request, res: Response) => unknown };
const discovered: Discovered[] = [];

function expressPathFromFile(rel: string): string {
    // rel is like "auth/me.ts" or "sessions/[id]/regenerate.ts"
    const noExt = rel.replace(/\.ts$/, '');
    const parts = noExt.split(path.sep);
    if (parts[parts.length - 1] === 'index') parts.pop();
    return (
        '/api/' +
        parts
            .map((p) => p.replace(/^\[(.+)\]$/, ':$1'))
            .join('/')
    );
}

function discover(dir: string, base = ''): void {
    for (const entry of readdirSync(dir)) {
        if (entry.startsWith('_')) continue;
        const full = path.join(dir, entry);
        const rel = base ? path.join(base, entry) : entry;
        if (statSync(full).isDirectory()) {
            discover(full, rel);
        } else if (entry.endsWith('.ts')) {
            const route = expressPathFromFile(rel);
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const mod = require(full);
            const handler = mod.default;
            if (typeof handler !== 'function') {
                console.warn(`[dev-server] ${rel} has no default export, skipping`);
                continue;
            }
            discovered.push({ route, handler });
        }
    }
}

discover(API_DIR);

// Sort by specificity so literal segments win over `:param` segments.
// Express picks the first matching route, so /sessions/token/:token must
// be mounted before /sessions/:id otherwise the latter swallows the former.
function specificity(route: string): number[] {
    const segs = route.split('/').filter(Boolean);
    // Fewer parameter segments = more specific = sort earlier.
    const paramCount = segs.filter((s) => s.startsWith(':')).length;
    return [paramCount, -segs.length];
}

discovered.sort((a, b) => {
    const sa = specificity(a.route);
    const sb = specificity(b.route);
    for (let i = 0; i < sa.length; i++) {
        if (sa[i] !== sb[i]) return sa[i] - sb[i];
    }
    return a.route.localeCompare(b.route);
});

const mounted: { route: string }[] = [];
for (const { route, handler } of discovered) {
    app.all(route.replace(/\/$/, '') || '/', async (req: Request, res: Response) => {
        try {
            // Vercel merges path params into req.query; Express splits them and
            // (in v5) makes req.query a frozen accessor. Define our own merged
            // `query` property the handler reads from.
            const merged = { ...(req.query as Record<string, unknown>), ...req.params };
            Object.defineProperty(req, 'query', {
                value: merged,
                configurable: true,
                writable: true,
            });
            await handler(req, res);
        } catch (err) {
            console.error(`[dev-server] ${route} threw:`, err);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        }
    });
    mounted.push({ route });
}

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

app.listen(PORT, () => {
    console.log(`\n🍕 atavola dev server on http://localhost:${PORT} (${serviceMode} mode)`);
    console.log('Mounted routes:');
    for (const r of mounted) {
        console.log(`  ${r.route}`);
    }
    if (isUsingMockServices) {
        console.log('\n────────────────────────────────────────────');
        console.log('🧪 MOCK MODE — no Supabase / OpenRouter needed.');
        console.log('   Sign in on the frontend with any email — no real');
        console.log('   magic-link is sent; we trust localStorage.');
        console.log('────────────────────────────────────────────\n');
    }
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

// Made with Bob
