import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/server/auth/api-guard";
import { discoverLeads, SearchLimitError } from "@/server/search/discover";
import { analyzeWebsite } from "@/server/analysis/analyze";
import { applyAnalysisToLead } from "@/server/db/leads";
import { scoreAndSaveLead } from "@/server/scoring/apply";
import { MAX_LIMIT } from "@/lib/search-limits";

const searchSchema = z.object({
  industry: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
  allowLarge: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await discoverLeads(parsed.data);

    // Analyze + score each discovered lead synchronously — fine at the
    // dev-limit scale enforced above. Milestone 6 adds background
    // processing and progress tracking for larger runs.
    for (const lead of result.leads) {
      if (lead.websiteUrl) {
        const analysis = await analyzeWebsite(lead.websiteUrl);
        applyAnalysisToLead(lead.id, analysis);
      }
      scoreAndSaveLead(lead.id);
    }

    return NextResponse.json({
      search: result.search,
      leadCount: result.leads.length,
      industryMatched: result.industryMatched,
    });
  } catch (err) {
    if (err instanceof SearchLimitError) {
      return NextResponse.json({ error: err.message, code: "SEARCH_LIMIT" }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
