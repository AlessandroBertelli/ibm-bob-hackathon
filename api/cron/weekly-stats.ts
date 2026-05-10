/**
 * GET /api/cron/weekly-stats — invoked by Vercel Cron once a week.
 *
 * Schedule lives in vercel.json (default: Monday 09:00 UTC). Vercel signs
 * cron requests with `Authorization: Bearer ${CRON_SECRET}` so we reject
 * anything else — this endpoint is otherwise public.
 *
 * Flow:
 *   1. Pull the digest payload from Postgres (RPC).
 *   2. Render the English plain-text + HTML email body.
 *   3. POST to Resend's REST API.
 *   4. On 2xx, ask Postgres to clean up the events (>30 days) + error_log.
 *
 * Sender is controlled by EMAIL_FROM (e.g. "atavola <no-reply@atavola.ch>").
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import {
    dataService,
    isUsingMockServices,
} from '../../backend/src/services/service-factory';
import type { WeeklyDigestData } from '../../backend/src/services/supabase.service';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_SENDER = 'atavola <no-reply@atavola.ch>';
const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

function unauthorised(res: VercelResponse) {
    res.status(401).json({ error: 'unauthorised' });
}

/**
 * Constant-time bearer comparison. Practical leak via response timing on a
 * CRON-only endpoint is small over network jitter, but the right primitive
 * costs nothing and removes the class of finding entirely.
 */
function authIsValid(req: VercelRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        console.warn('[cron/weekly-stats] CRON_SECRET not set — refusing to run');
        return false;
    }
    const expected = `Bearer ${secret}`;
    const raw = req.headers.authorization;
    const got = Array.isArray(raw) ? raw[0] : raw;
    if (typeof got !== 'string' || got.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

function getSender(): string {
    const raw = (process.env.EMAIL_FROM ?? '').trim();
    return raw || DEFAULT_SENDER;
}

function getRecipients(): string[] {
    const raw = (process.env.STATS_EMAIL_RECIPIENTS ?? '').trim();
    if (!raw) return [];
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.includes('@'));
}

interface DotPayload {
    color: 'green' | 'amber' | 'red';
    label: string;
}

function dotForOutcome(outcome: WeeklyDigestData['services'][number]['outcome']): DotPayload['color'] {
    switch (outcome) {
        case 'ok':
            return 'green';
        case 'rate_limited':
            return 'amber';
        case 'error':
            return 'red';
    }
}

const SERVICE_LABELS: Record<string, string> = {
    openrouter: 'OpenRouter — free models with rotation',
    imagegen: 'Image gen — Pollinations / Hugging Face / Cloudflare with rotation',
    vercel: 'Vercel — frontend + serverless API',
};

function fmtRow(label: string, week: number, month: number, total: number): string {
    return `${label.padEnd(18)} ${String(week).padStart(6)} / ${String(month).padStart(6)} / ${String(total).padStart(8)}`;
}

function renderPlainText(data: WeeklyDigestData): string {
    const lines: string[] = [];
    lines.push('atavola — Weekly stats');
    lines.push('======================');
    lines.push('');

    // Status block — include a row per known service even if we have no
    // record yet (defaults to ok / "no data").
    const known = ['openrouter', 'imagegen', 'vercel'];
    for (const k of known) {
        const row = data.services.find((s) => s.service === k);
        const colour = row ? dotForOutcome(row.outcome) : 'green';
        const dot = colour === 'green' ? '🟢' : colour === 'amber' ? '🟡' : '🔴';
        lines.push(`${dot}  ${SERVICE_LABELS[k] ?? k}`);
    }
    lines.push('');
    lines.push(`Hard errors this week: ${data.errors_count}`);
    lines.push('');

    lines.push('                    Week  /  30 days  /   Total');
    lines.push(fmtRow('Page visitors:', data.stats.visit?.week ?? 0, data.stats.visit?.month ?? 0, data.stats.visit?.total ?? 0));
    lines.push(fmtRow('Logins:', data.stats.login?.week ?? 0, data.stats.login?.month ?? 0, data.stats.login?.total ?? 0));
    lines.push(fmtRow('New uniques:', data.stats.new_user?.week ?? 0, data.stats.new_user?.month ?? 0, data.stats.new_user?.total ?? 0));
    lines.push(fmtRow('Meals generated:', data.stats.meal_generated?.week ?? 0, data.stats.meal_generated?.month ?? 0, data.stats.meal_generated?.total ?? 0));
    lines.push(fmtRow('Meals saved:', data.stats.meal_saved?.week ?? 0, data.stats.meal_saved?.month ?? 0, data.stats.meal_saved?.total ?? 0));
    lines.push('');

    if (data.errors.length > 0) {
        lines.push('Weekly log');
        lines.push('----------');
        for (const e of data.errors.slice(0, 50)) {
            lines.push(`[${e.ts}] ${e.source}: ${e.message}`);
        }
    }

    return lines.join('\n');
}

function renderHtml(data: WeeklyDigestData): string {
    const colour = (c: 'green' | 'amber' | 'red') =>
        c === 'green' ? '#10b981' : c === 'amber' ? '#f59e0b' : '#ef4444';

    const known = ['openrouter', 'imagegen', 'vercel'];
    const statusRows = known
        .map((k) => {
            const row = data.services.find((s) => s.service === k);
            const c = row ? dotForOutcome(row.outcome) : 'green';
            return `<tr>
                <td style="padding:4px 10px 4px 0; vertical-align:middle;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colour(c)};"></span>
                </td>
                <td style="padding:4px 0; vertical-align:middle; font-family:monospace; font-size:13px;">${SERVICE_LABELS[k] ?? k}</td>
            </tr>`;
        })
        .join('');

    const statRow = (label: string, key: keyof WeeklyDigestData['stats']) => {
        const s = data.stats[key] ?? { week: 0, month: 0, total: 0 };
        return `<tr>
            <td style="padding:4px 10px 4px 0; font-family:monospace; font-size:13px;">${label}</td>
            <td style="padding:4px 8px; font-family:monospace; font-size:13px; text-align:right;">${s.week}</td>
            <td style="padding:4px 8px; font-family:monospace; font-size:13px; text-align:right;">${s.month}</td>
            <td style="padding:4px 8px; font-family:monospace; font-size:13px; text-align:right;">${s.total}</td>
        </tr>`;
    };

    const errorList =
        data.errors.length === 0
            ? ''
            : `<h3 style="margin:24px 0 8px; font-size:14px;">Weekly log</h3>
               <ul style="font-family:monospace; font-size:11px; color:#666; padding-left:16px;">
                 ${data.errors
                     .slice(0, 50)
                     .map(
                         (e) =>
                             `<li>[${e.ts}] <strong>${escapeHtml(e.source)}:</strong> ${escapeHtml(e.message)}</li>`
                     )
                     .join('')}
               </ul>`;

    return `<!DOCTYPE html>
<html lang="en"><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif; color:#0f172a; max-width:640px; margin:auto; padding:24px;">
    <h1 style="font-size:20px; margin:0 0 4px;">atavola — Weekly stats</h1>
    <p style="font-size:12px; color:#64748b; margin:0 0 24px;">${new Date().toISOString().slice(0, 10)}</p>

    <h2 style="font-size:14px; margin:0 0 8px;">Live services</h2>
    <table style="border-collapse:collapse; margin-bottom:16px;">${statusRows}</table>

    <p style="font-size:13px; margin:8px 0 16px;">
        <strong>Hard errors this week:</strong> ${data.errors_count}
    </p>

    <h2 style="font-size:14px; margin:16px 0 8px;">Counters (Week / 30 days / Total)</h2>
    <table style="border-collapse:collapse;">
        ${statRow('Page visitors', 'visit')}
        ${statRow('Logins', 'login')}
        ${statRow('New uniques', 'new_user')}
        ${statRow('Meals generated', 'meal_generated')}
        ${statRow('Meals saved', 'meal_saved')}
    </table>

    ${errorList}
</body></html>`;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function sendViaResend(
    recipients: string[],
    subject: string,
    text: string,
    html: string
): Promise<{ ok: boolean; status: number; body: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return { ok: false, status: 500, body: 'RESEND_API_KEY not set' };
    }
    const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: getSender(),
            to: recipients,
            subject,
            text,
            html,
        }),
    });
    const body = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, body };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Vercel Cron uses GET. Reject everything else outright.
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: 'method not allowed' });
        return;
    }

    if (!authIsValid(req)) {
        unauthorised(res);
        return;
    }

    const recipients = getRecipients();
    if (recipients.length === 0) {
        // Configured to no-op — return a clean 200 so Vercel doesn't flag it.
        res.status(200).json({ skipped: true, reason: 'STATS_EMAIL_RECIPIENTS empty' });
        return;
    }

    if (isUsingMockServices) {
        // Mock mode: don't touch real Resend; useful for staging dry-runs.
        const data = await dataService.getWeeklyDigestData();
        res.status(200).json({ skipped: true, reason: 'mock mode', preview: data });
        return;
    }

    try {
        const data = await dataService.getWeeklyDigestData();
        const subject = `atavola — Weekly stats ${new Date().toISOString().slice(0, 10)}`;
        const send = await sendViaResend(recipients, subject, renderPlainText(data), renderHtml(data));

        if (!send.ok) {
            console.error('[cron/weekly-stats] Resend failed', send);
            // Never echo Resend's response body to the caller in prod —
            // it can contain account-specific hints (sender domain mismatch,
            // missing-permission strings) that aren't useful to a remote
            // attacker who only knew the cron secret.
            res.status(502).json({
                error: 'resend_failed',
                status: send.status,
                ...(IS_PROD ? {} : { body: send.body }),
            });
            return;
        }

        await dataService.cleanupAfterDigest();

        res.status(200).json({
            sent: true,
            to: recipients.length,
            errors_included: data.errors_count,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[cron/weekly-stats]', message);
        // Same reasoning — only echo internal error messages outside prod.
        res.status(500).json({
            error: 'internal_error',
            ...(IS_PROD ? {} : { message }),
        });
    }
}

// Made with Bob
