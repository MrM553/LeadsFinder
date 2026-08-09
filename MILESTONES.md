# MILESTONES.md — LeadFinder Roadmap

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

Work through milestones **sequentially**. Do not start a milestone until the previous one is tested and working. Update this file's checkboxes and add a short dated note under each milestone when it's completed.

---

## Milestone 0 — Project Foundation
- [x] Confirm architecture with user (this document + CLAUDE.md approved)
- [x] Initialize Next.js + TypeScript project
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Configure React Query
- [x] `.env.example` + typed env validation
- [x] ESLint / typecheck / test scripts (`lint`, `typecheck`, `test`)
- [x] `.gitignore` (node_modules, .env*, local db file)
- [x] Git repository initialized, first commit
- [x] `CLAUDE.md` and `MILESTONES.md` in place (this)
- [x] Basic project structure (`src/app`, `src/server`, `src/components`, `src/lib`)

## Milestone 1 — Database
- [x] Choose/confirm dedup key rule (normalized domain, documented in CLAUDE.md §9)
- [x] Drizzle ORM + SQLite set up for local dev
- [x] `leads` table (see field list in CLAUDE.md / product requirements)
- [x] `searches` table (industry, location, requested count, created_at, status)
- [x] `scoring_rules` table (configurable factors — see Milestone 4)
- [x] `notes` table (lead_id, text, created_at)
- [x] Migrations checked in
- [x] Seed script with clearly-fake sample leads for local dev/testing
- [x] Duplicate handling logic (insert-or-update by dedup key) with a unit test

## Milestone 2 — Lead Search
- [x] Search provider decision finalized (OpenStreetMap Overpass API)
- [x] Server-side search module: industry + location → candidate business results
- [x] German query construction (industry→OSM tag map with umlaut-tolerant matching + name-regex fallback for unmapped terms)
- [x] Result collection into `searches` + draft `leads` rows
- [x] Source URL tracked per result (OSM element permalink)
- [x] Rate limiting on Nominatim (1 req/s) and Overpass (throttled + retry-with-backoff on 429/5xx)
- [x] Dev-time result limit default (10), hard confirmation gate above 10, hard ceiling at 100

## Milestone 3 — Website Analysis
- [x] Fetch site with timeout, retry-once, robots.txt check
- [x] Website accessibility / status check
- [x] HTTPS check
- [x] Basic mobile indicator (viewport meta tag presence — heuristic, documented as such)
- [x] Contact form detection
- [x] Phone number detection (on-page, not guessed)
- [x] Email detection (on-page, not guessed)
- [x] CTA detection (heuristic German-phrase check)
- [x] Basic technical checks (title/meta description present)
- [x] Basic performance indicator (response time)
- [x] All analysis results persisted with `last_checked` timestamp

## Milestone 4 — Lead Scoring
- [x] Scoring engine as pure, unit-tested functions
- [x] 0–100 score from measurable factors only (no free-form AI judgment)
- [x] Score reasons returned as a structured list (not just a number)
- [x] Scoring weights/rules stored in `scoring_rules` table, editable without a code change
- [x] Industry relevance + location relevance factored in
- [x] Unit tests covering representative scoring scenarios

## Milestone 5 — Dashboard
- [x] Authentication (single agency-owner account to start)
- [x] Main view: total/new/qualified/high-score lead counts, recent searches, search entry point
- [x] Lead table: company, industry, city, website, score, status, date found
- [x] Table search, sort, filter
- [x] Status change control (NEW/REVIEWED/QUALIFIED/CONTACTED/FOLLOW_UP/CALL_BOOKED/PROPOSAL/WON/LOST/NOT_RELEVANT)
- [x] Notes on a lead
- [x] Lead detail page: all stored fields + full scoring breakdown + open website/open source links
- [x] All dashboard routes behind auth

## Milestone 6 — Search Jobs
- [x] Search progress tracking (queued/running/done/failed) surfaced in UI
- [x] Background processing (discovery is synchronous; analysis+scoring run detached, polled via `/api/search/[id]`)
- [x] Retry handling for failed per-lead analysis (bounded, not infinite)
- [x] Failed-request visibility (which leads failed analysis and why)
- [x] Enforce configured result limit end-to-end

## Milestone 7 — Production
- [ ] Investigate current recommended Cloudflare architecture for Next.js at time of implementation
- [ ] Cloudflare Workers deployment (via current recommended adapter)
- [ ] Cloudflare D1 production database + migration run
- [ ] Secrets configured via Cloudflare (never committed)
- [ ] Basic monitoring/error visibility (e.g. Workers logs / Sentry — decide when needed)
- [ ] Error handling review for production paths

## Milestone 8 — Polish
- [ ] UX pass on dashboard and search flow
- [ ] Performance pass (query indexes, table pagination, etc.)
- [ ] Security review (auth gaps, input validation, rate limits)
- [ ] Test coverage review for scoring/dedup/auth
- [ ] Documentation pass (README, CLAUDE.md accuracy check)

---

## Deferred (not part of any milestone above — see CLAUDE.md §13)
AI website audits · website screenshots · additional search providers · CSV export · advanced CRM · lead enrichment · personalized audit generation · outreach tracking · automated follow-up reminders · team accounts · multi-tenant/SaaS.

## Scoring Model (Milestone 4)

Additive, out of 100: `has_website` 15, `website_reachable` 8, `https_present` 8, `mobile_friendly` 8, `contact_form_present` 10, `cta_present` 8, `phone_detected` 5, `email_detected` 5, `fast_response` 6, `title_present` 3, `meta_description_present` 2, `industry_relevance` 12, `location_relevance` 10. Page-level rules only apply when the site is reachable — a lead with no website still earns industry/location relevance points. `technicalScore` is the technical-category subset normalized to 0–100; `performanceScore` is graded directly from response time (100/80/50/25/10) independent of rule weights, so it stays a stable gauge even if the user retunes `scoring_rules`. All weights live in `scoring_rules` (seeded from `src/server/scoring/rules.ts` defaults on first use, never overwritten if the user has customized a row) — editable without a code change per CLAUDE.md §3.

## Completion Log
_(Add an entry here each time a milestone is completed: date, what shipped, what needs manual configuration.)_

### 2026-08-09 — Milestone 0 complete
Next.js 16 (App Router, TS, Tailwind v4) scaffolded; shadcn/ui (base-nova preset) initialized; React Query, Drizzle ORM, better-sqlite3, zod, drizzle-kit, vitest, tsx installed. `src/server/{db,search,analysis,scoring}` structure created. `.env.example` + typed `env.ts`. Git repo initialized. No manual configuration needed yet.

### 2026-08-09 — Milestone 1 complete
Drizzle schema for `leads`, `searches`, `scoring_rules`, `notes` (src/server/db/schema.ts); shared status/enum types in src/types/lead.ts. Dedup key rule implemented and unit-tested (src/server/db/dedupe.ts, 9 passing tests): normalized domain when a website is known, else normalized "name|city". `upsertLead` (src/server/db/leads.ts) inserts new leads or merges into an existing one by dedup key without clobbering known fields with nulls. Initial migration generated and applied. Seed script (src/server/db/seed.ts) adds 1 fake search + 3 fake leads (clearly fictional "Muster..." names), skips if data already exists. Nothing for the user to configure manually.

### 2026-08-09 — Milestone 2 complete
Discovery pipeline in src/server/search/: `industry-map.ts` (German trade term → OSM tag, curated map + name-regex fallback for unmapped terms), `geocode.ts` (Nominatim, throttled to 1 req/s, Germany-scoped), `overpass.ts` (query builder + client, throttled, retries 429/502/503/504 up to 3x with backoff), `map-element.ts` (pure OSM element → lead mapper, never fabricates missing fields), `discover.ts` (orchestrates geocode → query → map → `upsertLead`, writes `searches` row with status/result count, enforces the confirmation-threshold and 100-lead ceiling). 14 new unit tests, all passing, no network calls in the test suite. Verified live against the real Overpass API: "Elektriker München" (limit 5) returned 5 real businesses with name/website/phone/email/source correctly captured; a "Dachdecker Rosenheim" test returned 0 results, which is a genuine OSM data-coverage gap for that specific craft tag in a smaller city, not a pipeline bug — worth knowing when picking test queries. Public Overpass instance does occasionally rate-limit (429) or time out (504) under load; the retry logic handles this. Nothing for the user to configure manually — no API keys involved.

### 2026-08-09 — Milestone 3 complete
Analysis pipeline in src/server/analysis/: `http.ts` (throttled fetch, identifying User-Agent), `robots.ts` (robots.txt fetch + parser with longest-match Allow/Disallow, specific-UA-group preference, fails open only on fetch/network error), `fetch-site.ts` (timeout + one retry, 2MB HTML cap, maps to UP/DOWN/UNREACHABLE), `detectors.ts` (pure heuristics: HTTPS, viewport meta, contact form, phone via tel:/regex, email via mailto:/regex, German CTA phrase list, title/meta description), `analyze.ts` (orchestrates robots check → fetch → detect). `applyAnalysisToLead` (src/server/db/leads.ts) writes detection flags + `lastChecked` and fills phone/email only when the lead doesn't already have one — never overwrites existing data. Added `response_time_ms`, `has_title`, `has_meta_description` columns to `leads` (migration 0001) so scoring can be recomputed later without re-fetching. 24 new unit tests (47 total), all passing, no network in the suite. Verified live against two real business sites (pittroff.de, elektro-bleumortier.de) — correctly extracted phone/email, detected HTTPS/mobile/contact-form/title/meta, and measured real response times; confirmed `applyAnalysisToLead` refreshes signals without clobbering an existing phone number. Nothing for the user to configure manually.

### 2026-08-09 — Milestone 4 complete
Scoring engine in src/server/scoring/: `rules.ts` (13 default rules, additive to 100, see "Scoring Model" above), `score.ts` (`scoreLead` — pure, takes signals + enabled rules, returns overall/technical/performance scores and a reason for every applicable rule whether met or missed; `computePerformanceScore` — graded from response time), `seed-rules.ts` (`ensureDefaultScoringRules`, upsert-by-key, never clobbers a user-customized rule), `apply.ts` (`scoreAndSaveLead` — loads a lead's stored signals + current rules, recomputes, writes back; no site re-fetch needed). Added `scoring_rules.category` and `leads.industry_matched` columns (migration 0002) so re-scoring works from stored data alone. 11 new unit tests (58 total), all passing — cover a perfect lead (100/100/100), a no-website lead (22, only relevance rules apply), disabled rules being omitted, re-weighted rules taking effect, and the fallback-industry-match case. Seed script now calls the real scoring engine instead of hand-typed scores; verified output: fully-optimized fake lead scores 92, a site with missing HTTPS/mobile/CTA/contact-form scores 48, a no-website lead scores 22 — all with correct reason lists. Nothing for the user to configure manually.

### 2026-08-09 — Milestone 5 complete
Auth: scrypt password hashing + timing-safe verify (`src/server/auth/password.ts`), HMAC-signed session cookie (`session.ts`), `getSession()`/`requireApiSession()` as the real enforcement point on every protected page and API route, `src/proxy.ts` (Next.js 16's middleware convention) as a cheap cookie-presence redirect for page UX only. Login page + `/api/auth/login`/`logout`. `npm run auth:hash-password` generates a `DASHBOARD_PASSWORD_HASH`.

API routes: `GET/PATCH /api/leads`, `/api/leads/[id]`, `/api/leads/[id]/notes`, `GET /api/stats`, `/api/industries`, `POST /api/search` (wraps discover → analyze → score per lead, synchronous at dev-limit scale). All zod-validated, all auth-gated.

Pages: `/` (stats + search form with the same confirmation gate as the API), `/leads` (React-Query-backed table with search/status/industry filters, sort, pagination, inline status change), `/leads/[id]` (full field dump, website signal badges, complete score breakdown, notes).

Fixed two issues found during browser testing: (1) `src/proxy.ts` must not import anything that pulls in `node:crypto` — it runs on the Edge runtime, unlike route handlers/server components — so the session cookie name was split into a crypto-free `constants.ts`; (2) Base UI's `Select.Value` doesn't auto-derive a label from `SelectItem` children for a dynamic value, so it now takes explicit children. Verified live in-browser end-to-end: login, dashboard stats, a real "Steuerberater München" search (5 results) that correctly discovered/analyzed/scored real businesses and updated the table, status change and note-add via direct API calls (the Select's portal popup doesn't work with this session's synthetic-click testing tool, but the API layer and rendered options were verified separately), logout, and a 401 on an unauthenticated API call. Renamed `middleware.ts` → `proxy.ts` per Next.js 16's current convention (resolved a build deprecation warning).

**Manual configuration needed:** the dev `.env.local` has a throwaway password (`dev-only-password-change-me`, username `admin`) — change `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD_HASH` before any real use, and never commit `.env.local` (already gitignored).

### 2026-08-09 — Milestone 6 complete
The POST `/api/search` route no longer awaits per-lead analysis+scoring in the request — it returns as soon as discovery finishes, and `processLeadsForSearch` (src/server/search/process-leads.ts) runs detached, wrapping each lead's analyze+score in its own try/catch so one broken site can't abort the batch. Progress (`resultsFound`/`resultsProcessed`/`resultsFailed`) is written to the `searches` row as it goes (migration 0003) and exposed via `GET /api/search/[id]`; the dashboard's `SearchForm` polls it every second until done and shows "analyzing N/M…" then a final failure count. Recent-searches list on the dashboard shows the same. 2 new unit tests confirm a lead whose analysis throws doesn't stop the rest of the batch and still gets a fallback score from whatever signals it has.

Also fixed a real bug found while testing this: the vitest suite was writing to the *same* SQLite file as the dev server (both read `DATABASE_URL` from `.env.local`), so running `npm test` was leaving fake "Testberuf/Teststadt" rows in the real dev dashboard. `vitest.setup.ts` now forces an isolated `data/leadfinder.test.db`, wiped and re-migrated before each test file — see CLAUDE.md §10.

Also renamed `src/middleware.ts` → `src/proxy.ts`'s exported function from `middleware` to `proxy` — the earlier Milestone 5 rename only moved the file; Next.js 16 actually requires the export itself to be named `proxy` (or `default`), which a clean production build caught.

**Note for Milestone 7:** `processLeadsForSearch` is fire-and-forget Node.js code, which only works because `next dev`/`next start` keep the process alive after the response is sent. On Cloudflare Workers the request context is torn down once the response returns unless execution is explicitly extended — the `POST /api/search` handler will need to wrap that call in `ctx.waitUntil()` (or move to a Cloudflare Queue if runs start exceeding a Worker's execution time limit). Flagged in a code comment at the call site already.

Nothing for the user to configure manually.
