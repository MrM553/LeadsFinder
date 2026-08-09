import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/server/auth/api-guard";
import { discoverLeads, SearchLimitError } from "@/server/search/discover";
import { processLeadsForSearch } from "@/server/search/process-leads";
import { MAX_LIMIT } from "@/lib/search-limits";
import { rateLimitOrResponse } from "@/server/rate-limit/api-rate-limit";
import { runInBackground } from "@/server/runtime/background-task";

const searchSchema = z.object({
  industry: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
  allowLarge: z.boolean().optional(),
});

// The most expensive/abuse-prone endpoint: each call hits Nominatim +
// Overpass + fetches every discovered site. Keep it tight.
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const limited = rateLimitOrResponse(`search:${session.username}`, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await discoverLeads(parsed.data);

    // Analysis + scoring run detached from this request so the response
    // isn't held open for the whole batch — the client polls
    // GET /api/search/[id] for progress. runInBackground keeps this alive
    // past the response on Cloudflare Workers via ctx.waitUntil().
    runInBackground(
      processLeadsForSearch(
        result.search.id,
        result.leads.map((l) => l.id)
      )
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
