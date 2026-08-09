# LeadFinder

A lead research and lead management tool for German local-service businesses (Handwerker, Steuerberater, etc.). Pipeline: **FIND → ANALYZE → SCORE → STORE → REVIEW.**

This is a research/CRM tool. It does **not** send outreach (no automated email, SMS, WhatsApp, LinkedIn, or calls).

See [`CLAUDE.md`](./CLAUDE.md) for architecture, conventions, and rules, and [`MILESTONES.md`](./MILESTONES.md) for the development roadmap and current status.

## Getting started

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`: set `AUTH_SECRET` to a random string, `DASHBOARD_USERNAME` to whatever you want, and generate `DASHBOARD_PASSWORD_HASH` with:

```bash
npm run auth:hash-password -- "your-password"
```

Then:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the username/password you set above.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/start
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm test` — run the test suite (Vitest)
- `npm run db:generate` — generate a Drizzle migration from schema changes
- `npm run db:migrate` — apply migrations to the local SQLite database
- `npm run db:seed` — insert clearly-fake sample data for local development
- `npm run auth:hash-password -- "password"` — generate a `DASHBOARD_PASSWORD_HASH` value
- `npm run cf:preview` / `npm run cf:deploy` — build and preview/deploy to Cloudflare Workers (see MILESTONES.md Milestone 7 — needs a Cloudflare account and is not yet fully wired up)

## Status

Milestones 0–6 and most of 8 are complete and working locally (search, website analysis, scoring, dashboard, auth, rate limiting). Milestone 7 (Cloudflare deployment) is scaffolded but not deployed — it needs a real Cloudflare account to finish. See `MILESTONES.md` for the detailed log.
