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
- [ ] Scoring engine as pure, unit-tested functions
- [ ] 0–100 score from measurable factors only (no free-form AI judgment)
- [ ] Score reasons returned as a structured list (not just a number)
- [ ] Scoring weights/rules stored in `scoring_rules` table, editable without a code change
- [ ] Industry relevance + location relevance factored in
- [ ] Unit tests covering representative scoring scenarios

## Milestone 5 — Dashboard
- [ ] Authentication (single agency-owner account to start)
- [ ] Main view: total/new/qualified/high-score lead counts, recent searches, search entry point
- [ ] Lead table: company, industry, city, website, score, status, date found
- [ ] Table search, sort, filter
- [ ] Status change control (NEW/REVIEWED/QUALIFIED/CONTACTED/FOLLOW_UP/CALL_BOOKED/PROPOSAL/WON/LOST/NOT_RELEVANT)
- [ ] Notes on a lead
- [ ] Lead detail page: all stored fields + full scoring breakdown + open website/open source links
- [ ] All dashboard routes behind auth

## Milestone 6 — Search Jobs
- [ ] Search progress tracking (queued/running/done/failed) surfaced in UI
- [ ] Background processing introduced only if request-time processing proves too slow for ~100 results
- [ ] Retry handling for failed per-lead analysis (bounded, not infinite)
- [ ] Failed-request visibility (which leads failed analysis and why)
- [ ] Enforce configured result limit end-to-end

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
