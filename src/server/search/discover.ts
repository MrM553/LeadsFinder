import { getDb } from "../db/get-db";
import { searches } from "../db/schema";
import { eq } from "drizzle-orm";
import { upsertLead } from "../db/leads";
import { geocodeGermanLocation } from "./geocode";
import { resolveIndustryTags } from "./industry-map";
import { buildOverpassQuery, runOverpassQuery } from "./overpass";
import { mapElementToLead } from "./map-element";
import type { Lead, Search } from "../db/schema";
import { DEV_DEFAULT_LIMIT, CONFIRMATION_THRESHOLD, MAX_LIMIT } from "@/lib/search-limits";

export { DEV_DEFAULT_LIMIT, CONFIRMATION_THRESHOLD, MAX_LIMIT };

export class SearchLimitError extends Error {}

export interface DiscoverLeadsInput {
  industry: string;
  location: string;
  limit?: number;
  /** Must be explicitly true to run a search above CONFIRMATION_THRESHOLD. */
  allowLarge?: boolean;
}

export interface DiscoverLeadsResult {
  search: Search;
  leads: Lead[];
  industryMatched: boolean;
}

export async function discoverLeads(input: DiscoverLeadsInput): Promise<DiscoverLeadsResult> {
  const db = getDb();
  const limit = input.limit ?? DEV_DEFAULT_LIMIT;

  if (limit > MAX_LIMIT) {
    throw new SearchLimitError(`Requested limit ${limit} exceeds the maximum of ${MAX_LIMIT}.`);
  }
  if (limit > CONFIRMATION_THRESHOLD && !input.allowLarge) {
    throw new SearchLimitError(
      `Requested limit ${limit} exceeds the dev confirmation threshold of ${CONFIRMATION_THRESHOLD}. ` +
        `Pass allowLarge: true after confirming this with the user.`
    );
  }

  const search = await db
    .insert(searches)
    .values({
      industry: input.industry,
      location: input.location,
      requestedCount: limit,
      status: "RUNNING",
    })
    .returning()
    .get();

  try {
    const geocoded = await geocodeGermanLocation(input.location);
    if (!geocoded) {
      return await failSearch(search, `Could not geocode location "${input.location}" within Germany.`);
    }

    const { tags, matched } = resolveIndustryTags(input.industry);
    const query = buildOverpassQuery(tags, geocoded.boundingBox, input.industry);
    const elements = await runOverpassQuery(query);

    const collected: Lead[] = [];
    for (const element of elements) {
      if (collected.length >= limit) break;
      const leadInput = mapElementToLead(element, input.industry);
      if (!leadInput) continue;
      const lead = await upsertLead({ ...leadInput, foundInSearchId: search.id, industryMatched: matched });
      collected.push(lead);
    }

    const done = await db
      .update(searches)
      .set({ status: "DONE", resultsFound: collected.length, updatedAt: new Date() })
      .where(eq(searches.id, search.id))
      .returning()
      .get();

    return { search: done, leads: collected, industryMatched: matched };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failSearch(search, message);
    throw err;
  }
}

async function failSearch(search: Search, message: string): Promise<DiscoverLeadsResult> {
  const db = getDb();
  await db
    .update(searches)
    .set({ status: "FAILED", errorMessage: message, updatedAt: new Date() })
    .where(eq(searches.id, search.id))
    .run();
  return { search: { ...search, status: "FAILED", errorMessage: message }, leads: [], industryMatched: false };
}
