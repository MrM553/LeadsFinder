import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle as drizzleD1, type DrizzleD1Database } from "drizzle-orm/d1";
// Imported explicitly (not via a global ambient type) so it doesn't collide
// with the "dom" lib's globals used by client components elsewhere in the app.
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

type AppDatabase = DrizzleD1Database<typeof schema>;

let cached: AppDatabase | null = null;

/**
 * Returns the D1-backed database when running inside a deployed Cloudflare
 * Worker, or the local better-sqlite3 database everywhere else (`next dev`,
 * CLI scripts, tests). `getCloudflareContext()` only succeeds in an actual
 * Worker — `next dev` never initializes it (see next.config.ts), so this
 * reliably picks the right backend without an explicit env flag.
 *
 * The local fallback is a *dynamic* import, not a static one — Workers
 * can't run better-sqlite3's native addon at all, and (the actual bug this
 * fixed) a static top-level import of ./client.ts opens a real SQLite file
 * the instant this module loads, which crashed Next's build-time page-data
 * collection for every route, not just ones that touch the database.
 *
 * D1 bindings are stable for the lifetime of a Worker instance (bound at
 * deploy time, not per-request), so caching the resolved client is safe.
 *
 * Typed uniformly as the D1 (async) shape even for the local fallback:
 * drizzle's better-sqlite3 driver exposes the exact same method names
 * (`.get()`/`.all()`/`.run()`) and every call site here already awaits
 * them, which works correctly against either driver at runtime — only the
 * static D1 type is asserted, to avoid a union type that breaks the query
 * builder's chained-method inference.
 */
export async function getDb(): Promise<AppDatabase> {
  if (cached) return cached;

  try {
    const { env } = getCloudflareContext();
    const d1 = (env as { DB?: D1Database }).DB;
    if (d1) {
      cached = drizzleD1(d1, { schema });
      return cached;
    }
  } catch {
    // Not running inside a Worker — fall through to the local database.
  }

  const { db: localDb } = await import("./client");
  cached = localDb as unknown as AppDatabase;
  return cached;
}
