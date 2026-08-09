import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { scoringRules } from "../db/schema";
import { DEFAULT_SCORING_RULES } from "./rules";

/** Inserts default scoring rules that don't already exist by key. Never overwrites a rule the user has customized. */
export function ensureDefaultScoringRules(): void {
  for (const rule of DEFAULT_SCORING_RULES) {
    const existing = db.select().from(scoringRules).where(eq(scoringRules.key, rule.key)).get();
    if (!existing) {
      db.insert(scoringRules).values(rule).run();
    }
  }
}
