import { createThrottle } from "./rate-limit";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "LeadFinder/0.1 (internal lead-research tool; not for redistribution)";

// Nominatim usage policy: max 1 request/second, identifying User-Agent required.
const throttle = createThrottle(1100);

export interface GeocodeResult {
  lat: number;
  lon: number;
  /** [south, north, west, east] in degrees, as returned by Nominatim. */
  boundingBox: [south: number, north: number, west: number, east: number];
  displayName: string;
  state?: string;
}

interface NominatimResponseItem {
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
  display_name: string;
  address?: { state?: string };
}

export async function geocodeGermanLocation(location: string): Promise<GeocodeResult | null> {
  await throttle();

  const params = new URLSearchParams({
    q: location,
    format: "jsonv2",
    countrycodes: "de",
    addressdetails: "1",
    limit: "1",
  });

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Nominatim geocoding request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as NominatimResponseItem[];
  const first = data[0];
  if (!first) return null;

  const [south, north, west, east] = first.boundingbox.map(Number) as [number, number, number, number];

  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    boundingBox: [south, north, west, east],
    displayName: first.display_name,
    state: first.address?.state,
  };
}
