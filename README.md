# LeadFinder

A lead research and lead management tool for German local-service businesses (Handwerker, Steuerberater, etc.). Pipeline: **FIND → ANALYZE → SCORE → STORE → REVIEW.**

This is a research/CRM tool. It does **not** send outreach (no automated email, SMS, WhatsApp, LinkedIn, or calls).

See [`CLAUDE.md`](./CLAUDE.md) for architecture, conventions, and rules, and [`MILESTONES.md`](./MILESTONES.md) for the development roadmap.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/start
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm test` — run the test suite (Vitest)
- `npm run db:generate` — generate a Drizzle migration from schema changes
- `npm run db:migrate` — apply migrations to the local SQLite database
- `npm run db:seed` — insert clearly-fake sample data for local development
