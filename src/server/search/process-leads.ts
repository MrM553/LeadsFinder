import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/get-db";
import { searches } from "../db/schema";
import { getLeadById, applyAnalysisToLead } from "../db/leads";
import { analyzeWebsite } from "../analysis/analyze";
import { scoreAndSaveLead } from "../scoring/apply";

/**
 * Analyzes and scores each discovered lead one at a time, isolating
 * failures per-lead so one broken site doesn't abort the whole batch.
 * Progress is written to `searches.resultsProcessed`/`resultsFailed` as it
 * goes so the UI can poll it. Intended to run detached from the request
 * that triggered the search (see the `void` call in the /api/search route),
 * wrapped in `ctx.waitUntil()` there so Cloudflare Workers doesn't tear down
 * execution once the response is sent.
 */
export async function processLeadsForSearch(searchId: number, leadIds: number[]): Promise<void> {
  const db = await getDb();

  for (const leadId of leadIds) {
    try {
      const lead = await getLeadById(leadId);
      if (!lead) continue;

      if (lead.websiteUrl) {
        const analysis = await analyzeWebsite(lead.websiteUrl);
        await applyAnalysisToLead(leadId, analysis);
      }
      await scoreAndSaveLead(leadId);
    } catch (err) {
      await db
        .update(searches)
        .set({ resultsFailed: sql`${searches.resultsFailed} + 1` })
        .where(eq(searches.id, searchId))
        .run();
      console.error(`processLeadsForSearch: lead ${leadId} in search ${searchId} failed:`, err);
    } finally {
      await db
        .update(searches)
        .set({ resultsProcessed: sql`${searches.resultsProcessed} + 1`, updatedAt: new Date() })
        .where(eq(searches.id, searchId))
        .run();
    }
  }
}
