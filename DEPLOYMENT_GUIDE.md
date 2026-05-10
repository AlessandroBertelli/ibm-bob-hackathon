# atavola — Deployment guide

End-to-end walkthrough for getting atavola live on **a single Vercel project** with Supabase. ~30 minutes once you have the API keys.

## Cost

- Supabase free tier: 500 MB DB, 1 GB Storage, 50k MAU.
- Vercel Hobby: 100 GB bandwidth/month, 100k function invocations/month, 60 s function `maxDuration`. Plenty.
- OpenRouter: free models cost nothing per call (each is rate-limited; the rotation list handles that).
- Pollinations.ai: free, no account.
- Hugging Face Inference: free with a token; rate-limited.
- Cloudflare Workers AI: free tier, ~3,300 FLUX-1-schnell images/day.
- Resend: 3k emails/month free.

Total: **$0/month** at hackathon scale.

---

## Prerequisites

- A GitHub repo with this code.
- Free accounts: Supabase, OpenRouter, Resend, Vercel. Optional but recommended: Hugging Face, Cloudflare (image-gen fallbacks).

---

## 1. Supabase

### 1.1 Create the project

1. https://supabase.com/dashboard → "New project".
2. Pick a region close to your users.
3. Wait ~2 min for provisioning.

### 1.2 Apply the schema

1. Open **SQL Editor** in the dashboard.
2. Paste and run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql). Single file, end-to-end:
   - tables (`profiles`, `saved_meals`, `sessions`, `session_meals`, `guests`, `votes`, `rate_log`, `service_status`, `events`, `aggregated_stats`, `error_log`),
   - RLS policies on every one of them,
   - RPCs (`cast_vote`, `ensure_guest`, `check_rate`, `record_service_outcome`, `record_event`, `record_error`, `get_weekly_digest_data`, `cleanup_after_digest`, `list_my_sessions`),
   - the `supabase_realtime` publication for live results,
   - the public-read `meal-images` Storage bucket,
   - and the daily pgcron `atavola-cleanup-expired-sessions` job at 03:15 UTC.

The file is idempotent — running it twice is safe.

### 1.3 Configure Auth

**Authentication → URL Configuration**
- Site URL: your future Vercel URL (you'll update once Vercel gives you the domain).
- Redirect URLs: add `${SITE_URL}/auth/verify`.

**Authentication → Email Templates → Magic Link**
- Default English copy is fine. Keep `{{ .ConfirmationURL }}` as the link placeholder.

**Authentication → SMTP Settings**
- Enable "Custom SMTP" and point it at Resend.
  ```
  Host:     smtp.resend.com
  Port:     465
  User:     resend
  Password: <Resend API key>
  Sender:   <verified domain>      (or onboarding@resend.dev for testing)
  Sender name: atavola
  ```

### 1.4 Grab the keys

**Settings → API**, copy:

- Project URL → `SUPABASE_URL` and `VITE_SUPABASE_URL`.
- `anon` public key → `VITE_SUPABASE_ANON_KEY`.
- `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose).

---

## 2. OpenRouter

1. https://openrouter.ai → sign up.
2. **Keys** → "Create Key". Copy the `sk-or-v1-...` value into `OPENROUTER_API_KEY`.
3. Browse https://openrouter.ai/models?max_price=0 and pick 3–5 free models. A solid starting set:
   ```
   OPENROUTER_MODELS=google/gemini-2.0-flash-exp:free,deepseek/deepseek-chat:free,meta-llama/llama-3.3-70b-instruct:free,mistralai/mistral-7b-instruct:free
   ```

---

## 3. Image-gen providers (optional but recommended)

`IMAGE_PROVIDERS` is comma-separated, tried in order. Pollinations alone works; adding the others gives resilience.

### 3.1 Pollinations.ai (no setup)

Already free, no account. Add `pollinations` to `IMAGE_PROVIDERS`.

### 3.2 Hugging Face Inference

1. https://huggingface.co/join → sign up (or use existing account).
2. https://huggingface.co/settings/tokens → "New token", role "Read".
3. Save as `HUGGINGFACE_API_TOKEN`.
4. Add `huggingface` to `IMAGE_PROVIDERS`.

### 3.3 Cloudflare Workers AI

1. https://dash.cloudflare.com → sign up.
2. **Account home** → copy the Account ID from the right rail → `CLOUDFLARE_ACCOUNT_ID`.
3. **My Profile → API Tokens → Create Token → Custom token**:
   - Permissions: `Account → Workers AI → Read`.
   - Account Resources: include your account.
4. Save the token as `CLOUDFLARE_API_TOKEN`.
5. Add `cloudflare` to `IMAGE_PROVIDERS`.

Recommended order: `pollinations,huggingface,cloudflare`. Pollinations is fastest; HF and CF are sturdier when Pollinations slows down.

---

## 4. Vercel

### 4.1 Import the project

1. https://vercel.com → "Add New" → "Project".
2. Import the GitHub repo.
3. Configure:
   - **Framework Preset**: Other (auto-detected from `vercel.json`).
   - **Root Directory**: `.` (repo root — leave default).
   - **Build / Output / Install** commands: leave at defaults; `vercel.json` overrides them.
4. Don't deploy yet — set env vars first.

### 4.2 Environment variables

Vercel → Project → Settings → Environment Variables. Add each, mark for Production + Preview + Development:

```
SERVICE_MODE=production

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

OPENROUTER_API_KEY=
OPENROUTER_MODELS=

IMAGE_PROVIDERS=pollinations,huggingface,cloudflare
HUGGINGFACE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Weekly digest email (Vercel Cron → /api/cron/weekly-stats)
RESEND_API_KEY=
EMAIL_FROM=atavola <no-reply@atavola.ch>
CRON_SECRET=
STATS_EMAIL_RECIPIENTS=
```

Notes:

- `EMAIL_FROM` is the sender for direct Resend HTTP calls (currently just the weekly digest). It's separate from the Supabase Auth → SMTP settings; magic-link mail still uses whatever you wired up there. The domain in `EMAIL_FROM` must be verified in Resend.
- `CRON_SECRET` is what Vercel signs cron requests with as `Authorization: Bearer …`. Set it both in the env-vars block above **and** in **Settings → Cron Jobs** for the project. Mismatch → the cron 401s.
- `STATS_EMAIL_RECIPIENTS` is a comma-separated list. Empty = the cron runs but skips sending (handy in staging).
- The schedule itself lives in [`vercel.json`](vercel.json) (`crons` block). Default is every Monday 09:00 UTC; change it there and redeploy.
- `VITE_API_URL` is intentionally absent — same-origin defaults to `/api` and that's correct here.

### 4.3 Deploy

Click "Deploy". ~1–2 minutes. Note the URL (e.g. `https://atavola.vercel.app`).

### 4.4 Custom Domain & DNS

If you have a domain like `atavola.ch`:
1. **Vercel → Settings → Domains**: Add `atavola.ch`.
2. **DNS Records**: Vercel will provide an **A record** (for `@`) and a **CNAME record** (for `www`). Set these in your registrar's dashboard (e.g., Cloudflare, Namecheap).
3. **Verify**: Once the SSL certificate is issued by Vercel, the domain status will turn green.

### 4.5 Loop the URL back to Supabase

Go back to **Supabase → Authentication → URL Configuration**: ensure the **Site URL** and **Redirect URLs** use `https://atavola.ch`. If you don't do this, users will be redirected to the default `vercel.app` domain instead of your custom one.

---

## 5. Smoke test

```bash
curl https://your-app.vercel.app/api/system/health
# → {"status":"ok","mode":"production",...}
```

In a private window:

1. Open the Vercel URL.
2. Sign in with magic link (check your inbox — see "Resend domain" gotcha below).
3. Create a session: vibe + headcount + no pre-selected meals.
4. Wait for the 4 cards to appear with images.
5. Click "Share voting link". Try the **native share** button (mobile only) and the **copy link** button. Tapping the URL pill itself also copies. Try the **QR code**.
6. In another private window, open the link, swipe through the 4 cards.
7. In the host window, watch the live results re-rank.
8. Heart a card → it appears under "My Food" in your profile dropdown.
9. Reload the profile, drag to reorder, swipe a row left to delete.

If any step fails, check Vercel function logs (Project → Logs → click a function) and the browser console.

---

## 6. Custom domain (optional)

1. Buy at any registrar (Cloudflare Registrar is at-cost).
2. Vercel → Project → Settings → Domains → Add. Follow Vercel's DNS instructions.
3. Once active, update **Supabase → Authentication → URL Configuration** to use the new domain.
4. Update **Resend → Domains** to verify the new sending domain so magic-link emails work for everyone, not just yourself.

No code changes needed — the app reads URLs from env / runtime, never hardcoded.

---

## 7. Email deliverability (SPF / DKIM / DMARC)

Magic-link delivery is the silent growth lever — if mail lands in spam, sign-ups die without you noticing. Resend's dashboard walks you through the DNS records; here's what to set on the apex domain (`atavola.ch`):

1. **SPF** (`TXT @`) — tells receivers which servers may send mail "as" your domain.
   ```
   v=spf1 include:_spf.resend.com ~all
   ```
   `~all` (soft fail) is the right choice while you stabilise; switch to `-all` (hard fail) once you're confident no other systems send mail from atavola.ch.

2. **DKIM** — Resend auto-generates a CNAME pair when you verify the domain. Copy them into DNS verbatim. They look like:
   ```
   resend._domainkey  CNAME  resend._domainkey.<region>.amazonses.com
   ```
   Wait for Resend to flip the domain status to "verified" (usually <10 min).

3. **DMARC** (`TXT _dmarc`) — tells receivers what to do with mail that fails SPF / DKIM and where to report aggregate failures.
   ```
   v=DMARC1; p=none; rua=mailto:no-reply@atavola.ch; pct=100; aspf=r; adkim=r
   ```
   Start with `p=none` so you collect reports without rejecting legitimate mail. After a week of clean reports, tighten to `p=quarantine`, then `p=reject`.

4. **Reverse DNS** is handled by Resend on their sending IPs — nothing for you to configure.

5. **Verify**: send a magic-link to a Gmail address and inspect the headers. You want `dkim=pass`, `spf=pass`, `dmarc=pass`. [https://www.mail-tester.com/](https://www.mail-tester.com/) gives a 0–10 score; aim for 9+.

The same Resend domain powers the weekly digest (`/api/cron/weekly-stats`). `EMAIL_FROM` must use this verified domain or sends bounce silently.

---

## 8. SEO submission

The static landing page, `/about`, `/privacy`, and `/terms` ship with full meta and JSON-LD; `robots.txt`, `sitemap.xml`, `llms.txt`, and `humans.txt` live in `frontend/public/`. After first deploy:

1. **Google Search Console** — [https://search.google.com/search-console](https://search.google.com/search-console). Add the property (use DNS verification on atavola.ch so all subdomains are covered). Submit `https://atavola.ch/sitemap.xml`. Indexing usually starts within hours.
2. **Bing Webmaster Tools** — [https://www.bing.com/webmasters](https://www.bing.com/webmasters). Same flow; Bing also feeds DuckDuckGo results.
3. **Yandex Webmaster** (optional, only if you care about RU/CIS traffic).
4. **Sitemap auto-discovery** — `robots.txt` already references the sitemap. Most crawlers find it automatically; the manual submission above just shortens the discovery window.
5. **Validate**:
   - [Google Rich Results Test](https://search.google.com/test/rich-results) — paste each of `/`, `/about`, `/privacy`, `/terms` and confirm the JSON-LD blocks parse.
   - [Twitter / X Card Validator](https://cards-dev.twitter.com/validator) — paste the home URL, confirm the OG image renders.
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — same.
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — same. Click "Scrape Again" if cached.
   - [securityheaders.com](https://securityheaders.com/) and [Mozilla Observatory](https://observatory.mozilla.org/) — both should score A or A+.
   - [PageSpeed Insights](https://pagespeed.web.dev/) — Core Web Vitals must be green for ranking.

---

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Function logs say "Refusing to boot: SERVICE_MODE=…" | Vercel env var unset or misspelled | Set `SERVICE_MODE=production` exactly. The hard fail is intentional — see [SECURITY.md](SECURITY.md) #C1. |
| Magic-link email never arrives for anyone but you | Resend domain not verified | Verify the domain in Resend, then point Supabase SMTP at it. Until verified, only your own address receives mail. |
| 401 on every call | RLS denies because policies didn't run | Re-apply both migrations — verify policies under `Authentication → Policies`. |
| `cast_vote` errors with `session_expired` or `session_not_open` | Session is older than 30 days or status moved off `voting` | Hosts create a new session; expiry is enforced server-side and the daily pgcron purges past it anyway. |
| `cast_vote` errors with `invalid_guest_token` | Guest hasn't been minted | Frontend should call `POST /api/votes/guest` once before voting (it does — clear localStorage and reload if stale). |
| 429 on rate-limited endpoints | The Postgres rate-limit RPC threw | Check function logs for `[checkRate] RPC failed` warnings. The limiter fails open to avoid locking real users out, but a sustained warning means you're effectively unprotected — fix the underlying DB error. |
| Generated images broken | Every image provider failed magic-byte sniff or quota | Inspect the function log — provider names + reasons are logged. Most common: wrong CF/HF key, or HF model warming up (just retry). |
| Meal generation 503s | All OpenRouter free models hit their daily quota | Add more models to `OPENROUTER_MODELS`; rotation will skip past empty ones. |
| Vercel function times out | LLM + 4 image fetches > 60 s | Drop a slow provider from `IMAGE_PROVIDERS` (HF when its servers are loading). Long-term: Vercel Pro = 300 s, or split generation into per-meal endpoints (out of scope today). |

<!-- Made with Bob -->
