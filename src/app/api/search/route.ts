import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/server/auth/api-guard";
import { discoverLeads, SearchLimitError } from "@/server/search/discover";
import { processLeadsForSearch } from "@/server/search/process-leads";
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

    // Analysis + scoring run detached from this request so the response
    // isn't held open for the whole batch — the client polls
    // GET /api/search/[id] for progress. (On Cloudflare Workers this call
    // will need wrapping in ctx.waitUntil(); see process-leads.ts.)
    void processLeadsForSearch(
      result.search.id,
      result.leads.map((l) => l.id)
    );

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
