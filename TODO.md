# TODO

Tracked items that aren't done yet.

## Loose ends

- **Real contributor LinkedIn URLs** — `frontend/src/components/landing/Contributors.tsx` has placeholders for Alessandro and Marco. Drop their URLs in once they send them.
- **Hand-designed `og.png`** — `frontend/public/og.svg` ships a clean 1200×630 SVG which renders on Twitter / Mastodon / Slack / Discord, but Facebook and LinkedIn don't reliably parse SVG OG images. Have a designer produce a 1200×630 PNG and drop it at `frontend/public/og.png`. Then add a parallel `<meta property="og:image" content="https://atavola.ch/og.png" />` line above the SVG one in every HTML head.

## SEO and AI-discoverability — done in v2.11

The big one is shipped. What remains is operator-side, not code:

### Already in code
- Full `<head>` meta + canonical + theme-color + OG + Twitter Card on home + every static page.
- Three JSON-LD blocks on `/`: `SoftwareApplication`, `Organization`, `WebSite` with `SearchAction`.
- `WebPage` / `AboutPage` JSON-LD on `/about`, `/privacy`, `/terms`.
- Static crawler-indexable pages at canonical URLs (`/about`, `/privacy`, `/terms`).
- `<noscript>` block on the SPA shell with real prose + outbound links.
- `robots.txt` with explicit allow-rules for GPTBot / ClaudeBot / Claude-Web / anthropic-ai / PerplexityBot / Google-Extended / Applebot-Extended / CCBot.
- `sitemap.xml` listing `/`, `/about`, `/privacy`, `/terms`.
- `humans.txt`, `.well-known/security.txt` (RFC 9116).
- `llms.txt` and `llms-full.txt` (the emerging AI-readable convention).
- 1200×630 `og.svg` for social previews.
- Asset weight: home assets dropped from ~3.7 MB to ~487 KB after compressing logo / philipp portrait and removing the unused 1.4 MB `favicon.png` and the 2 MB `favicon.svg`.
- Vercel `cleanUrls: true` + cache-control on the static marketing pages.

### Operator action items (one-time, post-deploy)
- **Google Search Console** — add the property (DNS verification on atavola.ch) and submit `https://atavola.ch/sitemap.xml`.
- **Bing Webmaster Tools** — same. Bing also feeds DuckDuckGo.
- **DNS records for email**: SPF + DKIM + DMARC on atavola.ch via Resend's dashboard. See [DEPLOYMENT_GUIDE §7](DEPLOYMENT_GUIDE.md#7-email-deliverability-spf--dkim--dmarc). Verify with mail-tester.com → ≥ 9/10.
- **Validators after each deploy**:
  - Google Rich Results Test on every public URL.
  - Twitter / LinkedIn / Facebook share validators on the home URL.
  - securityheaders.com → ≥ A.
  - Mozilla Observatory → ≥ A.
  - PageSpeed Insights → green Core Web Vitals.

### Operator action items (ongoing)
- **Brand-name claims** — register `atavola` on GitHub-org, Twitter/X, Mastodon, Bluesky, Threads, Reddit, ProductHunt. Even dormant accounts prevent squatting and make the brand verifiable.
- **Backlinks without paying**:
  - ProductHunt launch on a Tuesday (best traffic day). Schedule a hunter, prepare gallery + tagline + first comment. Aim for top-10 placement.
  - Hacker News "Show HN" once UX polish is solid. Title pattern: "Show HN: atavola — group meal planning by swiping (free)". Plan for the comment thread (be present in EU + US business hours).
  - IndieHackers "Show IH" with a build-narrative bent.
  - Reddit: r/SideProject (showcase OK), r/Cooking (subtle, content-first), r/InternetIsBeautiful (delight angle), r/recipes (content), r/CasualConversation. Avoid r/Cooking with a "promote yourself" tone — it'll backfire.
  - Awesome-list PRs: awesome-decision-tools, awesome-vercel, awesome-supabase, awesome-hackathon-projects, awesome-tinder-clones (yes, that exists). Each accepted PR is a permanent backlink from a high-DA repo.
  - GitHub repo: add topic tags (`meal-planning`, `group-decision`, `tinder-clone`, `swipe-cards`, `supabase`, `vercel`, `openrouter`, `hackathon`). Topic tags are a free GitHub-internal SEO boost.
  - Devto / Hashnode cross-posts of the build narrative. Free, indexed quickly.
  - Listings: alternativeto.net (under "Group decision making"), saashub.com, betalist.com, startupbase.io.
- **Content** (a minimal `/blog/` under `frontend/public/blog/<slug>/index.html`, three posts):
  1. "What we built and why" — founder narrative, screenshots, links to the live app.
  2. "The free-tier stack that runs atavola" — Supabase + Vercel + OpenRouter + Pollinations + Cloudflare. Earns links from devtool blogs.
  3. "Tinder-style group voting in 2026" — UX rationale. Earns links from product-design folk.
  Each post needs `WebPage` + `Article` JSON-LD, OG image, canonical URL, and a link from `/about`.
- **AI assistant verification**: a week after deploy, ask ChatGPT / Claude / Perplexity / Gemini "what is atavola?" and confirm they pull from `/llms.txt`. If not, double-check robots.txt explicit-allows for those bots.
- **Internal linking**: every blog post links to `/about`, `/about` links to `/`, `/` links to `/about` + `/privacy` + `/terms`. Triangulation helps PageRank flow.
- **Schema.org refresh**: when you ship a public-changeable feature (e.g. a public ranking or a recipe library), add the matching schema (`ItemList`, `Recipe`).

### Avoid these mistakes
- Don't buy backlinks. Google's spam classifiers are good enough that paid backlinks net out negative.
- Don't stuff keywords. Modern ranking is semantic; one good page outranks ten thin pages.
- Don't auto-generate pages. Every URL should reward a human visitor first.
- Don't over-launch. Each launch (PH, HN, blog post) is a one-shot; sequence them weeks apart so each gets attention.

## Security audit — done in v2.12

Full audit landed; see [AUDIT-2026-05-07.md](AUDIT-2026-05-07.md). All HIGH and CRITICAL findings are either fixed in code or have a clear operator action below. SECURITY.md gained an [Incident-response runbook](SECURITY.md#incident-response-runbook) covering rotation per service.

## Operator action — git history scrub (CRITICAL)

Two real secrets are still in `git log -p`:

| Secret | Commit | File (now deleted) |
|---|---|---|
| Resend API key `re_2av33fqz_*` | `4eaecb2c` | `RESEND_MIGRATION.md` |
| OpenAI API key `sk-proj-1VY69P*` | `c57c8c80` | `DEPLOYMENT_CONFIG.md` |

History rewrite is **only useful if rotation already happened**. Rotate first.

### Step 1 — rotate (if not already done)

- **Resend** → [resend.com/api-keys](https://resend.com/api-keys) → revoke `re_2av33fqz_*`, create new, update `RESEND_API_KEY` in Vercel + Supabase Auth → SMTP, redeploy.
- **OpenAI** → [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → revoke `sk-proj-1VY69P*`, create new if you still need it (atavola itself doesn't use OpenAI directly — this key was committed in error during early experimentation; if it isn't used anywhere active, just revoke and don't replace).

Confirm rotation by attempting an API call with the leaked key — it must return 401.

### Step 2 — install git-filter-repo

```bash
brew install git-filter-repo
```

(macOS / Linuxbrew. Pip alternative: `pip install git-filter-repo`.)

### Step 3 — back up before destruction

```bash
# Run from one parent directory above the repo.
cp -R ibm-bob-hackathon ibm-bob-hackathon.backup-$(date +%Y%m%d)
```

If the rewrite goes sideways the backup is your only recovery path.

### Step 4 — scrub on `neon`

```bash
cd /Users/pr/Desktop/Github/ibm-bob-hackathon

# Make sure neon is checked out and clean.
git checkout neon
git status   # must show "nothing to commit, working tree clean"

# Drop the two files entirely from history. (They no longer exist in the
# working tree, but they live on in older commits.)
git filter-repo --force \
    --invert-paths \
    --path RESEND_MIGRATION.md \
    --path DEPLOYMENT_CONFIG.md

# Belt-and-braces: nuke any literal secret string still in the history of
# *other* files. Replacements file uses gitleaks's findings verbatim.
cat > /tmp/atavola-secrets.txt <<'EOF'
REDACTED_RESEND_KEY==>REDACTED_RESEND_KEY
REDACTED_OPENAI_KEY==>REDACTED_OPENAI_KEY
EOF

git filter-repo --force --replace-text /tmp/atavola-secrets.txt
rm /tmp/atavola-secrets.txt

# Verify: gitleaks should now report 0 high-severity findings on history.
gitleaks detect --log-opts="--all" --no-banner
```

### Step 5 — restore the remote on `neon` and force-push

`git filter-repo` deliberately removes the `origin` remote so you can't accidentally push without thinking about it.

```bash
git remote add origin git@github.com:<your-org>/ibm-bob-hackathon.git
git push origin neon --force --force-with-lease
```

### Step 6 — repeat on `main`

The leaked commits exist on `main` too (or an earlier branch that merged into main). Apply the same procedure:

```bash
cd /Users/pr/Desktop/Github/ibm-bob-hackathon
git checkout main
git status

git filter-repo --force \
    --invert-paths \
    --path RESEND_MIGRATION.md \
    --path DEPLOYMENT_CONFIG.md

cat > /tmp/atavola-secrets.txt <<'EOF'
REDACTED_RESEND_KEY==>REDACTED_RESEND_KEY
REDACTED_OPENAI_KEY==>REDACTED_OPENAI_KEY
EOF
git filter-repo --force --replace-text /tmp/atavola-secrets.txt
rm /tmp/atavola-secrets.txt

gitleaks detect --log-opts="--all" --no-banner

git remote add origin git@github.com:<your-org>/ibm-bob-hackathon.git
git push origin main --force --force-with-lease
```

### Step 7 — clean up downstream copies

After force-push, **every** existing clone (yours, teammates', CI, Vercel's clone if it caches) holds the old history. Cure:

```bash
# In every other working tree:
cd path/to/clone
git fetch origin --prune
git reset --hard origin/<branch>     # OR: rm -rf the dir and reclone
```

For Vercel: trigger a manual redeploy from the dashboard so it pulls the rewritten history.

### Step 8 — rotate `CRON_SECRET` while you're at it

Optional but cheap. Generate a fresh value and update both Vercel env + Vercel Cron settings (must match):

```bash
# 32 random bytes, hex.
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 9 — install the pre-commit guard

So this never happens again:

```bash
brew install gitleaks
cd /Users/pr/Desktop/Github/ibm-bob-hackathon

# Add a pre-commit hook that runs gitleaks against staged content.
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
gitleaks protect --staged --redact --no-banner --exit-code 1
EOF
chmod +x .git/hooks/pre-commit
```

## Other operator follow-ups from the audit

- **Bump `@vercel/node` 2.x → 4.x** (separate commit, smoke-test). All 9 npm-audit findings flow from this transitive dep; runtime risk is bounded today (we don't fetch attacker-controlled URLs) but the upgrade is overdue.
- **Verify CSP doesn't block JSON-LD** in Chromium / Safari / Firefox after the next deploy. Open DevTools → Console on `/`, `/about`, `/privacy`, `/terms`. CSP3 spec exempts non-classic script types but real-world browsers vary.
- **Re-run `gitleaks detect --log-opts="--all"`** after Step 7 above and confirm 0 high-severity findings.
- **Consider tightening `style-src 'unsafe-inline'`** away from inline styles. Tailwind v4 may permit this; static legal pages need their `<style>` blocks moved to external files first.

<!-- Made with Bob -->
