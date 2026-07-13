
# Deep Platform Audit — 10/10, No-Compromise Pass

Goal: verify every tab, every section, every edge function, every cron job, every RLS policy, and every UI route works end-to-end with no broken links, no stale data, no security gaps, no console errors. Produce a categorized findings report, then fix everything in one consolidated pass.

## Scope — what gets audited

### 1. Frontend Routes (27 pages)
For each page in `src/pages/`:
- Renders without console errors (Playwright per route)
- Data fetch succeeds (network 200, non-empty where expected)
- Loading + empty + error states present
- Mobile (375px) + desktop (1280px) layouts pass
- Internal links resolve (no 404s)
- SEO: `<title>`, meta description, single H1, canonical, OG tags, JSON-LD where applicable
- Auth gating correct (public vs protected vs admin)

Pages covered: Index, About, Blog, BlogPost, Directory, AutonomousColleges, Jobs, News, Gazette, Events, EventDetail, EventPass, UpcomingEvents, Programs, ProgramsListing, ProgramDetail, Resources, Dashboard, Contact, Privacy, Terms, VerifyCertificate, CASPromotionFAQ, DraftRegulations2025, InstitutionRegister, auth/*, tools/*.

### 2. Components (admin, blog, dashboard, home, tools)
- Prop types and null-safety on all queries
- No hardcoded colors (semantic tokens only)
- No mock/placeholder data leaking into production
- Accessibility: alt text, aria-labels, keyboard nav, focus rings
- AdminPanel tabs all functional: Automation, AI Drafts, Users, Content, Events, Programs, Institutions

### 3. Edge Functions (9 functions)
For each in `supabase/functions/`:
- CORS headers on every response (incl. errors)
- Input validation (Zod) on body params
- API keys read safely from env, validated before use
- `EdgeRuntime.waitUntil()` properly wrapping long work
- `automation_runs` logging on start + finish + error
- Anti-hallucination domain filter applied where applicable
- Retry/backoff on external API failures
- Recent invocation logs clean (no 500s)

Functions: auto-blog-generator, auto-content-generator, automation-healthcheck, content-cleanup, journal-quality, scholar-impact, scrape-gazette, scrape-news, update-autonomous-colleges.

### 4. Database & Security
- Run `supabase--linter` — fix every error/warning
- Run `security--run_security_scan` — fix every finding
- Confirm RLS enabled on all 17 public tables
- Confirm GRANTs present for each table (per Cloud rule)
- Validate `has_role` / `is_admin` used everywhere admin checks happen (no client-side role checks)
- Foreign key integrity check
- Indexes on hot query paths (blog_posts.slug, news_updates.published_at, etc.)

### 5. Cron Jobs
- Query `cron.job` and `cron.job_run_details` — confirm 8 clean schedules, no duplicates
- Last 7 days of runs: success rate per job
- `pg_net` requests returning 200 (not NULL)
- `automation_runs` table populating

### 6. Data Freshness (per "super updated" requirement)
- `news_updates.published_at` MAX ≤ 24h old
- `blog_posts.created_at` MAX ≤ 24h old
- `autonomous_colleges_directory.updated_at` MAX ≤ 7d old
- `events.start_date` future events ≥ 5
- Gazette notifications ≤ 48h
- If stale: trigger functions manually + investigate root cause

### 7. SEO Audit
- Run `seo_chat--trigger_scan` → fix all findings
- Verify sitemap.xml lists all public routes
- Verify robots.txt + canonical setup
- `/llms-full.txt` and RSS endpoints respond

### 8. Auth & Roles
- Super Admin (balkishan@futurevarsity.edu.in) auto-assignment trigger fires
- Email/password + Google OAuth both work
- Profile auto-created on signup
- Protected routes redirect unauthenticated users

### 9. Build & Type Safety
- TS build clean (no errors, no `any` smells in new code)
- No unused imports / dead exports
- Bundle size sanity check

## Deliverable

1. **Findings report** — numbered list grouped by severity (Critical / High / Medium / Polish), each with file:line and reproduction
2. **Fix pass** — implement every Critical + High, batch-fix Medium, log Polish as backlog
3. **Verification** — re-run linter, security scan, SEO scan, Playwright route sweep
4. **Summary** — confirmation that each of the 9 scope areas is 10/10

## Out of scope (this audit)
- New features
- Visual redesign
- Marketing copy rewrites
- Third-party integrations not already wired

## Technical approach
- Subagents in parallel for: (a) route sweep via Playwright, (b) edge-function code review, (c) DB/RLS/cron review, (d) SEO scan
- Consolidate findings, then single-batch fix migration + code edits
- Final re-verification before sign-off

Approve to start the audit, or tell me to narrow/expand scope (e.g. skip admin-only pages, focus only on automation, etc.).
