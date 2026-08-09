import { createThrottle } from "./rate-limit";
import type { OsmTagFilter } from "./industry-map";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "LeadFinder/0.1 (internal lead-research tool; not for redistribution)";
const QUERY_TIMEOUT_S = 25;

// Public Overpass instance fair-use: avoid rapid/parallel querying.
const throttle = createThrottle(2000);

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

  const clauses =
    tags.length > 0
      ? tags.map((t) => `  nwr["${t.key}"="${t.value}"](${bboxStr});`).join("\n")
      : `  nwr[~"^(shop|craft|office)$"~"."]["name"~"${escapeOverpassRegex(fallbackNameTerm ?? "")}",i](${bboxStr});`;

  return `[out:json][timeout:${QUERY_TIMEOUT_S}];\n(\n${clauses}\n);\nout center tags;`;
}

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

async function runOverpassQueryOnce(query: string): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (QUERY_TIMEOUT_S + 5) * 1000);

  try {
    const res = await fetch(OVERPASS_URL, {
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

/** Overpass's public instance is shared and occasionally overloaded/rate-limited; retry transient errors with backoff. */
export async function runOverpassQuery(query: string): Promise<OverpassElement[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await throttle();
    try {
      return await runOverpassQueryOnce(query);
    } catch (err) {
      lastError = err;
      const status = (err as Error & { status?: number }).status;
      const retryable = status !== undefined && RETRYABLE_STATUS.has(status);
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw lastError;
}
