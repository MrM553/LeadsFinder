import type { OverpassElement } from "./overpass";
import type { LeadDiscoveryInput } from "../db/leads";

/**
 * Converts a raw OSM element into lead input. Returns null for elements
 * with no name — we can't identify a business without one, and we never
 * fabricate a company name.
 */
export function mapElementToLead(element: OverpassElement, industry: string): LeadDiscoveryInput | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  const websiteUrl = tags.website ?? tags["contact:website"] ?? null;
  const phone = tags.phone ?? tags["contact:phone"] ?? null;
  const email = tags.email ?? tags["contact:email"] ?? null;
  const city = tags["addr:city"]?.trim() || null;
  const region = tags["addr:state"]?.trim() || null;

  return {
    companyName: name,
    websiteUrl,
    industry,
    city,
    region,
    country: "Germany",
    phone,
    email,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    websiteStatus: websiteUrl ? "UNKNOWN" : "NO_WEBSITE",
  };
}
