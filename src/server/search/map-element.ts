import type { OverpassElement } from "./overpass";
import type { LeadDiscoveryInput } from "../db/leads";
import { deriveIndustryLabel } from "./industry-map";

/**
 * `amenity`/`leisure` tags cover a lot of public infrastructure alongside
 * real businesses (a broad search's amenity/leisure category widening —
 * see overpass.ts — otherwise surfaces parking lots and benches as "leads").
 * Excluding known infrastructure values rather than allow-listing business
 * ones, since the business list is much larger and open-ended.
 */
const NON_BUSINESS_AMENITY_VALUES = new Set([
  "parking",
  "parking_space",
  "parking_entrance",
  "bicycle_parking",
  "motorcycle_parking",
  "bench",
  "waste_basket",
  "waste_disposal",
  "recycling",
  "toilets",
  "drinking_water",
  "telephone",
  "post_box",
  "clock",
  "fountain",
  "grave_yard",
  "atm",
  "vending_machine",
  "shelter",
  "charging_station",
  "fire_hydrant",
  "street_lamp",
  "bbq",
  "picnic_table",
  "loading_dock",
  "bicycle_repair_station",
  "compressed_air",
  "waiting_room",
  "bicycle_rental",
]);

const NON_BUSINESS_LEISURE_VALUES = new Set([
  "park",
  "playground",
  "pitch",
  "garden",
  "nature_reserve",
  "common",
  "dog_park",
  "bandstand",
  "bird_hide",
  "fishing",
  "slipway",
  "swimming_area",
  "track",
  "picnic_table",
]);

function isLikelyNonBusiness(tags: Record<string, string>): boolean {
  if (tags.amenity && NON_BUSINESS_AMENITY_VALUES.has(tags.amenity)) return true;
  if (tags.leisure && NON_BUSINESS_LEISURE_VALUES.has(tags.leisure)) return true;
  return false;
}

/**
 * Converts a raw OSM element into lead input. Returns null for elements
 * with no name (we can't identify a business without one, and we never
 * fabricate a company name) or for elements that are clearly public
 * infrastructure rather than a business.
 *
 * `industry` is the user's search term for a targeted search, or `null` for
 * a broad (all business types) search — in which case the label is derived
 * per-element from whichever category tag it actually has.
 */
export function mapElementToLead(element: OverpassElement, industry: string | null): LeadDiscoveryInput | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;
  if (isLikelyNonBusiness(tags)) return null;

  const websiteUrl = tags.website ?? tags["contact:website"] ?? tags.url ?? tags["contact:url"] ?? null;
  const phone = tags.phone ?? tags["contact:phone"] ?? null;
  const email = tags.email ?? tags["contact:email"] ?? null;
  const city = tags["addr:city"]?.trim() || null;
  const region = tags["addr:state"]?.trim() || null;

  return {
    companyName: name,
    websiteUrl,
    industry: industry ?? deriveIndustryLabel(tags),
    city,
    region,
    country: "Germany",
    phone,
    email,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    websiteStatus: websiteUrl ? "UNKNOWN" : "NO_WEBSITE",
  };
}
