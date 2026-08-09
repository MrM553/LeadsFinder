import { existsSync, rmSync } from "node:fs";

// Vitest doesn't auto-load .env.local the way Next.js does.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Tests must never touch the real dev/seed database — use an isolated,
// freshly-migrated file per test-file run.
process.env.DATABASE_URL = "data/leadfinder.test.db";

for (const suffix of ["", "-wal", "-shm"]) {
  const path = `data/leadfinder.test.db${suffix}`;
  if (existsSync(path)) rmSync(path);
}

// Dynamic imports (not static) so they run after the env var above is set —
// static imports would be hoisted ahead of it.
const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
const { db } = await import("./src/server/db/client");
migrate(db, { migrationsFolder: "./drizzle" });
