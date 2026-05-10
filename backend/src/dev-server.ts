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
 *   - api/[[...path]].ts  → /api/* (Optional Catch-All)
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
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

type Discovered = { 
    route: string | RegExp; 
    handler: (req: Request, res: Response) => unknown;
    isCatchAll: boolean;
    paramName?: string;
    originalPath: string;
};
const discovered: Discovered[] = [];

function expressPathFromFile(rel: string): Discovered['route'] | { route: RegExp; isCatchAll: true; paramName: string } {
    const noExt = rel.replace(/\.ts$/, '');
    const parts = noExt.split(path.sep);
    if (parts[parts.length - 1] === 'index') parts.pop();
    
    const last = parts[parts.length - 1];
    if (last && last.startsWith('[[...') && last.endsWith(']]')) {
        const paramName = last.slice(5, -2);
        parts.pop();
        const prefix = '/api/' + parts.join('/');
        // Escape prefix for RegExp
        const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match prefix, prefix/, or prefix/anything
        const regex = new RegExp(`^${escapedPrefix}(?:/(.*))?$`);
        return { route: regex, isCatchAll: true, paramName };
    }

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
            const res = expressPathFromFile(rel);
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const mod = require(full);
            const handler = mod.default;
            if (typeof handler !== 'function') {
                console.warn(`[dev-server] ${rel} has no default export, skipping`);
                continue;
            }

            if (typeof res === 'object' && 'isCatchAll' in res) {
                discovered.push({ 
                    route: res.route, 
                    handler, 
                    isCatchAll: true, 
                    paramName: res.paramName,
                    originalPath: '/api/' + rel.replace(/\.ts$/, '')
                });
            } else {
                discovered.push({ 
                    route: res as string, 
                    handler, 
                    isCatchAll: false,
                    originalPath: res as string
                });
            }
        }
    }
}

discover(API_DIR);

function getSpecificity(d: Discovered): number {
    if (d.isCatchAll) return 2;
    if (typeof d.route === 'string' && d.route.includes(':')) return 1;
    return 0;
}

discovered.sort((a, b) => {
    const specA = getSpecificity(a);
    const specB = getSpecificity(b);
    if (specA !== specB) return specA - specB;
    // Same specificity: longer route (more segments) first
    return b.originalPath.length - a.originalPath.length || a.originalPath.localeCompare(b.originalPath);
});

const mounted: { route: string; original: string }[] = [];
for (const { route, handler, isCatchAll, paramName, originalPath } of discovered) {
    app.all(route, async (req: Request, res: Response) => {
        try {
            const merged: Record<string, unknown> = { ...(req.query as Record<string, unknown>), ...req.params };

            if (isCatchAll && paramName) {
                // Express RegExp matches put capture groups in req.params[0], [1], etc.
                const val = req.params[0];
                const segments = typeof val === 'string' ? val.split('/').filter(Boolean) : [];
                merged[paramName] = segments;
            }

            Object.defineProperty(req, 'query', {
                value: merged,
                configurable: true,
                writable: true,
            });
            await handler(req, res);
        } catch (err) {
            console.error(`[dev-server] ${originalPath} threw:`, err);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        }
    });
    mounted.push({ 
        route: typeof route === 'string' ? route : route.source,
        original: originalPath
    });
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
        console.log(`  ${r.original} -> ${r.route}`);
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
