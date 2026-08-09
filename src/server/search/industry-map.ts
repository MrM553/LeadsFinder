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

  // --- Added for broader coverage ---
  zahnarzt: [{ key: "amenity", value: "dentist" }],
  zahnaerztin: [{ key: "amenity", value: "dentist" }],
  arzt: [{ key: "amenity", value: "doctors" }],
  aerztin: [{ key: "amenity", value: "doctors" }],
  hausarzt: [{ key: "amenity", value: "doctors" }],
  tierarzt: [{ key: "amenity", value: "veterinary" }],
  physiotherapeut: [{ key: "healthcare", value: "physiotherapist" }],
  physiotherapie: [{ key: "healthcare", value: "physiotherapist" }],
  friseur: [{ key: "shop", value: "hairdresser" }],
  friseursalon: [{ key: "shop", value: "hairdresser" }],
  kosmetikstudio: [{ key: "shop", value: "beauty" }],
  autowerkstatt: [{ key: "shop", value: "car_repair" }],
  kfzwerkstatt: [{ key: "shop", value: "car_repair" }],
  fahrschule: [{ key: "amenity", value: "driving_school" }],
  gaertner: [{ key: "craft", value: "gardener" }],
  gartenbau: [{ key: "craft", value: "gardener" }],
  garten: [{ key: "craft", value: "gardener" }],
  fliesenleger: [{ key: "craft", value: "tiler" }],
  glaser: [{ key: "craft", value: "glaziery" }],
  glaserei: [{ key: "craft", value: "glaziery" }],
  schlosser: [{ key: "craft", value: "locksmith" }],
  schluesseldienst: [{ key: "shop", value: "locksmith" }],
  immobilienmakler: [{ key: "office", value: "estate_agent" }],
  immobilien: [{ key: "office", value: "estate_agent" }],
  versicherung: [{ key: "office", value: "insurance" }],
  versicherungsmakler: [{ key: "office", value: "insurance" }],
  apotheke: [{ key: "amenity", value: "pharmacy" }],
  baeckerei: [{ key: "shop", value: "bakery" }],
  metzgerei: [{ key: "shop", value: "butcher" }],
  fleischerei: [{ key: "shop", value: "butcher" }],
  optiker: [{ key: "shop", value: "optician" }],
  notar: [{ key: "office", value: "notary" }],
  reinigung: [{ key: "craft", value: "cleaning" }],
  gebaeudereinigung: [{ key: "craft", value: "cleaning" }],
  bestattung: [{ key: "shop", value: "funeral_directors" }],
  bestatter: [{ key: "shop", value: "funeral_directors" }],
  physiotherapiepraxis: [{ key: "healthcare", value: "physiotherapist" }],

  handwerker: [
    { key: "craft", value: "roofer" },
    { key: "craft", value: "electrician" },
    { key: "craft", value: "plumber" },
    { key: "craft", value: "carpenter" },
    { key: "craft", value: "painter" },
    { key: "craft", value: "mason" },
    { key: "craft", value: "hvac" },
    { key: "craft", value: "gardener" },
    { key: "craft", value: "tiler" },
    { key: "craft", value: "locksmith" },
    { key: "craft", value: "glaziery" },
  ],
};

function normalizeIndustryTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z]/g, "");
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
