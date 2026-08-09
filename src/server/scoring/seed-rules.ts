import { eq } from "drizzle-orm";
import { getDb } from "../db/get-db";
import { scoringRules } from "../db/schema";
import { DEFAULT_SCORING_RULES } from "./rules";

/** Inserts default scoring rules that don't already exist by key. Never overwrites a rule the user has customized. */
export async function ensureDefaultScoringRules(): Promise<void> {
  const db = getDb();
  for (const rule of DEFAULT_SCORING_RULES) {
    const existing = await db.select().from(scoringRules).where(eq(scoringRules.key, rule.key)).get();
    if (!existing) {
      await db.insert(scoringRules).values(rule).run();
    }
  }
}
