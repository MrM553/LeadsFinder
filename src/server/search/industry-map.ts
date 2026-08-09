/**
 * Maps a German industry term to OpenStreetMap tag filters. Curated for the
 * trades this tool targets; unmapped terms fall back to a name-regex search
 * (see overpass.ts) rather than failing outright.
 */

export interface OsmTagFilter {
  key: string;
  value: string;
}

const INDUSTRY_TAG_MAP: Record<string, OsmTagFilter[]> = {
  dachdecker: [{ key: "craft", value: "roofer" }],
  elektriker: [{ key: "craft", value: "electrician" }],
  elektrotechnik: [{ key: "craft", value: "electrician" }],
  elektroinstallateur: [{ key: "craft", value: "electrician" }],
  sanitaer: [{ key: "craft", value: "plumber" }],
  installateur: [{ key: "craft", value: "plumber" }],
  klempner: [{ key: "craft", value: "plumber" }],
  steuerberater: [{ key: "office", value: "tax_advisor" }],
  maler: [{ key: "craft", value: "painter" }],
  tischler: [{ key: "craft", value: "carpenter" }],
  schreiner: [{ key: "craft", value: "carpenter" }],
  zimmerer: [{ key: "craft", value: "carpenter" }],
  maurer: [{ key: "craft", value: "mason" }],
  heizungsbauer: [{ key: "craft", value: "hvac" }],
  heizungsbau: [{ key: "craft", value: "hvac" }],
  heizung: [{ key: "craft", value: "hvac" }],
  rechtsanwalt: [{ key: "office", value: "lawyer" }],
  anwalt: [{ key: "office", value: "lawyer" }],
  handwerker: [
    { key: "craft", value: "roofer" },
    { key: "craft", value: "electrician" },
    { key: "craft", value: "plumber" },
    { key: "craft", value: "carpenter" },
    { key: "craft", value: "painter" },
    { key: "craft", value: "mason" },
    { key: "craft", value: "hvac" },
  ],
};

function normalizeIndustryTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

export interface IndustryResolution {
  tags: OsmTagFilter[];
  /** false when we fell back to a generic name-match query. */
  matched: boolean;
}

export function resolveIndustryTags(industry: string): IndustryResolution {
  const key = normalizeIndustryTerm(industry);
  const mapped = INDUSTRY_TAG_MAP[key];
  if (mapped) return { tags: mapped, matched: true };
  return { tags: [], matched: false };
}
