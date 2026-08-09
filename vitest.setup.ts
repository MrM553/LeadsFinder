import { existsSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterAll } from "vitest";

// Vitest doesn't auto-load .env.local the way Next.js does.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Tests must never touch the real dev/seed database. Each test-file worker
// gets its own file (vitest runs files in parallel workers by default —
// sharing one file path caused concurrent workers to race on delete/create,
// see Milestone 8) — freshly created and migrated every run.
const testDbPath = `data/leadfinder.test.${randomUUID()}.db`;
process.env.DATABASE_URL = testDbPath;

for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${testDbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

// Dynamic imports (not static) so they run after the env var above is set —
// static imports would be hoisted ahead of it.
const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
const { db, closeDb } = await import("./src/server/db/client");
migrate(db, { migrationsFolder: "./drizzle" });

afterAll(() => {
  // Best-effort cleanup only — never fail the suite over a leftover temp
  // file. Close the connection first: Windows won't delete a file that's
  // still open (unlike POSIX), even in WAL mode.
  try {
    closeDb();
  } catch {
    // ignore
  }
  for (const suffix of ["", "-wal", "-shm"]) {
    const path = `${testDbPath}${suffix}`;
    try {
      if (existsSync(path)) rmSync(path);
    } catch {
      // ignore — stray temp file, not worth failing the run over
    }
  }
});
