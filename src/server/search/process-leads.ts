import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { searches } from "../db/schema";
import { getLeadById, applyAnalysisToLead } from "../db/leads";
import { analyzeWebsite } from "../analysis/analyze";
import { scoreAndSaveLead } from "../scoring/apply";

/**
 * Analyzes and scores each discovered lead one at a time, isolating
 * failures per-lead so one broken site doesn't abort the whole batch.
 * Progress is written to `searches.resultsProcessed`/`resultsFailed` as it
 * goes so the UI can poll it. Intended to run detached from the request
 * that triggered the search (see the `void` call in the /api/search route);
 * on Cloudflare Workers this will need wrapping in `ctx.waitUntil()`
 * (Milestone 7 — Workers tears down execution once the response is sent
 * unless explicitly extended).
 */
export async function processLeadsForSearch(searchId: number, leadIds: number[]): Promise<void> {
  for (const leadId of leadIds) {
    try {
      const lead = getLeadById(leadId);
      if (!lead) continue;

      if (lead.websiteUrl) {
        const analysis = await analyzeWebsite(lead.websiteUrl);
        applyAnalysisToLead(leadId, analysis);
      }
      scoreAndSaveLead(leadId);
    } catch (err) {
      db.update(searches)
        .set({ resultsFailed: sql`${searches.resultsFailed} + 1` })
        .where(eq(searches.id, searchId))
        .run();
      console.error(`processLeadsForSearch: lead ${leadId} in search ${searchId} failed:`, err);
    } finally {
      db.update(searches)
        .set({ resultsProcessed: sql`${searches.resultsProcessed} + 1`, updatedAt: new Date() })
        .where(eq(searches.id, searchId))
        .run();
    }
  }
}
