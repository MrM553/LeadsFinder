import { createThrottle } from "./rate-limit";
import type { OsmTagFilter } from "./industry-map";

// Multiple public instances: the primary (overpass-api.de) returns a
// Cloudflare-edge 521 ("origin refused connection") when called from a
// Cloudflare Worker specifically — confirmed reachable and healthy from a
// plain machine, so this looks like the origin blocking Cloudflare's IP
// ranges rather than an outage. Falls through to a mirror in that case.
const OVERPASS_URLS = ["https://overpass-api.de/api/interpreter", "https://overpass.osm.ch/api/interpreter"];
const USER_AGENT = "LeadFinder/0.1 (internal lead-research tool; not for redistribution)";
const QUERY_TIMEOUT_S = 25;

// Public Overpass instances fair-use: avoid rapid/parallel querying. Eased
// from 2000ms after observing both configured instances return clean-but-
// empty responses for a query that had real results minutes earlier —
// consistent with this tool's own request volume contributing to it.
const throttle = createThrottle(3000);

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function escapeOverpassRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\"]/g, "\\$&");
}

/**
 * Builds an Overpass QL query. `bbox` is [south, north, west, east]
 * (Nominatim order); Overpass bbox filters expect (south,west,north,east).
 */
export function buildOverpassQuery(
  tags: OsmTagFilter[],
  bbox: [south: number, north: number, west: number, east: number],
  fallbackNameTerm?: string
): string {
  const [south, north, west, east] = bbox;
  const bboxStr = `${south},${west},${north},${east}`;

  // Fallback category list for unmapped industry terms — covers most
  // business-like OSM tag keys, not just shop/craft/office, so terms like
  // "Zahnarzt" (amenity) or "Physiotherapeut" (healthcare) still find
  // something even before they're added to the curated industry map.
  const FALLBACK_CATEGORIES = "shop|craft|office|amenity|healthcare|leisure";

  const clauses =
    tags.length > 0
      ? tags.map((t) => `  nwr["${t.key}"="${t.value}"](${bboxStr});`).join("\n")
      : fallbackNameTerm
        ? `  nwr[~"^(${FALLBACK_CATEGORIES})$"~"."]["name"~"${escapeOverpassRegex(fallbackNameTerm)}",i](${bboxStr});`
        : // Broad search: no industry term at all — any named business-like
          // entity in the area, not filtered by name text.
          `  nwr[~"^(${FALLBACK_CATEGORIES})$"~"."]["name"](${bboxStr});`;

  return `[out:json][timeout:${QUERY_TIMEOUT_S}];\n(\n${clauses}\n);\nout center tags;`;
}

const RETRYABLE_STATUS = new Set([429, 502, 503, 504, 521, 522, 523, 524]);
const MAX_ATTEMPTS_PER_ENDPOINT = 2;

async function runOverpassQueryOnce(url: string, query: string): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (QUERY_TIMEOUT_S + 5) * 1000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!res.ok) {
      const error = new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
      (error as Error & { status?: number }).status = res.status;
      throw error;
    }

    const data = (await res.json()) as OverpassResponse;
    return data.elements ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Tries each configured Overpass endpoint in turn, retrying transient
 * errors (rate limits, timeouts, edge-level failures) with backoff before
 * falling through to the next endpoint.
 *
 * An empty (zero-element) response does NOT short-circuit this — it's kept
 * as a fallback answer, but every remaining endpoint is still tried first.
 * This was a real bug: the primary instance is known to treat Cloudflare-
 * Worker-origin traffic specially (it returns a 521 there — see the comment
 * above OVERPASS_URLS), and empirically it sometimes returns a "successful"
 * response with zero elements instead of an error for the exact same query
 * that returns real results moments later — silently discarding real leads
 * with no error to show for it.
 */
export async function runOverpassQuery(query: string): Promise<OverpassElement[]> {
  let lastError: unknown;
  let emptyResult: OverpassElement[] | null = null;

  for (const url of OVERPASS_URLS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_ENDPOINT; attempt++) {
      await throttle();
      try {
        const elements = await runOverpassQueryOnce(url, query);
        if (elements.length > 0) return elements;
        emptyResult = elements;
        break; // no point retrying the same endpoint for a non-error empty response
      } catch (err) {
        lastError = err;
        const status = (err as Error & { status?: number }).status;
        // Retry unless we have a specific status telling us retrying won't
        // help (e.g. a genuine 400). An error with no status at all (a
        // network failure, or a malformed/non-JSON body under a 200 —
        // confirmed possible in practice) is retried too, not treated as final.
        const retryable = status === undefined || RETRYABLE_STATUS.has(status);
        if (!retryable || attempt === MAX_ATTEMPTS_PER_ENDPOINT) break;
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  // Note: a "confirmed empty" result here can still be a false negative if
  // *both* configured instances happen to be transiently degraded at once
  // (observed in practice, likely worsened by this tool's own request
  // volume during heavy testing) — discoverLeads's auto-widen-on-empty
  // retry (a different, larger bbox) provides a second, differently-timed
  // attempt on top of this rather than compounding latency further here.
  if (emptyResult) return emptyResult;
  throw lastError;
}
