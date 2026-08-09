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
- [ ] Search provider decision finalized (see "External Services" in proposal)
- [ ] Server-side search module: industry + location → candidate business results
- [ ] German query construction (e.g. `"{industry} {location}"`, handles umlauts)
- [ ] Result collection into `searches` + draft `leads` rows
- [ ] Source URL tracked per result
- [ ] Rate limiting on the search endpoint
- [ ] Dev-time result limit default (5–10), configurable, with an explicit confirmation step before running a search for 100 results

## Milestone 3 — Website Analysis
- [ ] Fetch site with timeout, retry-once, robots.txt check
- [ ] Website accessibility / status check
- [ ] HTTPS check
- [ ] Basic mobile indicator (viewport meta tag presence, etc. — heuristic, documented as such)
- [ ] Contact form detection
- [ ] Phone number detection (on-page, not guessed)
- [ ] Email detection (on-page, not guessed)
- [ ] CTA detection (heuristic keyword/button check)
- [ ] Basic technical checks (title/meta present, broken obvious markers)
- [ ] Basic performance indicator (response time; not a full Lighthouse run in v1)
- [ ] All analysis results persisted with `last_checked` timestamp

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
