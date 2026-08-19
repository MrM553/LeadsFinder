import { getDb } from "../db/get-db";
import { searches } from "../db/schema";
import { eq } from "drizzle-orm";
import { upsertLead } from "../db/leads";
import { geocodeGermanLocation, type GeocodeResult } from "./geocode";
import { resolveIndustryTags, type OsmTagFilter } from "./industry-map";
import { buildOverpassQuery, runOverpassQuery } from "./overpass";
import { mapElementToLead } from "./map-element";
import type { Lead, Search } from "../db/schema";
import { DEV_DEFAULT_LIMIT, CONFIRMATION_THRESHOLD, MAX_LIMIT } from "@/lib/search-limits";

export { DEV_DEFAULT_LIMIT, CONFIRMATION_THRESHOLD, MAX_LIMIT };

export class SearchLimitError extends Error {}

/** Shown in the searches table/UI when no industry was specified (broad search). */
const BROAD_SEARCH_LABEL = "Alle Branchen";

export interface DiscoverLeadsInput {
  /** Omit (or empty string) for a broad search across all business types. */
  industry?: string;
  location: string;
  limit?: number;
  /** Must be explicitly true to run a search above CONFIRMATION_THRESHOLD. */
  allowLarge?: boolean;
}

export interface DiscoverLeadsResult {
  search: Search;
  leads: Lead[];
  industryMatched: boolean;
  /** True if the initial area had no results and a wider radius found some. */
  areaExpanded: boolean;
}

/** ~15-17km at German latitudes — pulls in the surrounding area/district, not just the town itself. */
const WIDEN_MARGIN_DEGREES = 0.15;

function expandBbox(
  bbox: [south: number, north: number, west: number, east: number],
  marginDegrees: number
): [south: number, north: number, west: number, east: number] {
  const [south, north, west, east] = bbox;
  return [south - marginDegrees, north + marginDegrees, west - marginDegrees, east + marginDegrees];
}

export async function discoverLeads(input: DiscoverLeadsInput): Promise<DiscoverLeadsResult> {
  const db = await getDb();
  const limit = input.limit ?? DEV_DEFAULT_LIMIT;
  const industryTerm = input.industry?.trim() || null;

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
      industry: industryTerm ?? BROAD_SEARCH_LABEL,
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

    // A broad search (no industry given) trivially "matches" — there's no
    // specific term it could have missed.
    const { tags, matched } = industryTerm ? resolveIndustryTags(industryTerm) : { tags: [], matched: true };
    const { elements, areaExpanded } = await runWithAreaWiden(tags, geocoded, industryTerm);

    const collected: Lead[] = [];
    for (const element of elements) {
      if (collected.length >= limit) break;
      const leadInput = mapElementToLead(element, industryTerm);
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

    return { search: done, leads: collected, industryMatched: matched, areaExpanded };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failSearch(search, message);
    throw err;
  }
}

/** Runs the Overpass query; if the initial area has no results, retries once with a wider radius. */
async function runWithAreaWiden(
  tags: OsmTagFilter[],
  geocoded: GeocodeResult,
  industryTerm: string | null
): Promise<{ elements: Awaited<ReturnType<typeof runOverpassQuery>>; areaExpanded: boolean }> {
  const query = buildOverpassQuery(tags, geocoded.boundingBox, industryTerm ?? undefined);
  const elements = await runOverpassQuery(query);
  if (elements.length > 0) {
    return { elements, areaExpanded: false };
  }

  const widerBbox = expandBbox(geocoded.boundingBox, WIDEN_MARGIN_DEGREES);
  const widerQuery = buildOverpassQuery(tags, widerBbox, industryTerm ?? undefined);
  const widerElements = await runOverpassQuery(widerQuery);
  return { elements: widerElements, areaExpanded: widerElements.length > 0 };
}

async function failSearch(search: Search, message: string): Promise<DiscoverLeadsResult> {
  const db = await getDb();
  await db
    .update(searches)
    .set({ status: "FAILED", errorMessage: message, updatedAt: new Date() })
    .where(eq(searches.id, search.id))
    .run();
  return {
    search: { ...search, status: "FAILED", errorMessage: message },
    leads: [],
    industryMatched: false,
    areaExpanded: false,
  };
}
