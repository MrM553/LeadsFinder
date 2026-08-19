import { describe, it, expect } from "vitest";
import { mapElementToLead } from "./map-element";
import type { OverpassElement } from "./overpass";

describe("mapElementToLead", () => {
  it("returns null when the element has no name", () => {
    const element: OverpassElement = { type: "node", id: 1, tags: { craft: "roofer" } };
    expect(mapElementToLead(element, "Dachdecker")).toBeNull();
  });

  it("maps a fully-tagged element", () => {
    const element: OverpassElement = {
      type: "way",
      id: 42,
      tags: {
        name: "Musterdach GmbH",
        website: "https://musterdach.de",
        phone: "+49 1234 5678",
        email: "info@musterdach.de",
        "addr:city": "Rosenheim",
        "addr:state": "Bayern",
      },
    };
    const lead = mapElementToLead(element, "Dachdecker");
    expect(lead).toEqual({
      companyName: "Musterdach GmbH",
      websiteUrl: "https://musterdach.de",
      industry: "Dachdecker",
      city: "Rosenheim",
      region: "Bayern",
      country: "Germany",
      phone: "+49 1234 5678",
      email: "info@musterdach.de",
      sourceUrl: "https://www.openstreetmap.org/way/42",
      websiteStatus: "UNKNOWN",
    });
  });

  it("never fabricates missing fields — leaves them null", () => {
    const element: OverpassElement = { type: "node", id: 7, tags: { name: "Handwerk Musterhaus" } };
    const lead = mapElementToLead(element, "Dachdecker");
    expect(lead?.websiteUrl).toBeNull();
    expect(lead?.phone).toBeNull();
    expect(lead?.email).toBeNull();
    expect(lead?.city).toBeNull();
    expect(lead?.websiteStatus).toBe("NO_WEBSITE");
  });

  it("prefers contact:* tags when the plain tag is absent", () => {
    const element: OverpassElement = {
      type: "node",
      id: 8,
      tags: { name: "X", "contact:website": "https://x.de", "contact:phone": "123", "contact:email": "a@x.de" },
    };
    const lead = mapElementToLead(element, "Dachdecker");
    expect(lead?.websiteUrl).toBe("https://x.de");
    expect(lead?.phone).toBe("123");
    expect(lead?.email).toBe("a@x.de");
  });

  it("also checks url/contact:url tag variants for the website", () => {
    const element: OverpassElement = { type: "node", id: 9, tags: { name: "Y", url: "https://y.de" } };
    expect(mapElementToLead(element, "Dachdecker")?.websiteUrl).toBe("https://y.de");
  });

  it("derives a per-element industry label for a broad search (industry passed as null)", () => {
    const roofer: OverpassElement = { type: "node", id: 10, tags: { name: "A", craft: "roofer" } };
    const hairdresser: OverpassElement = { type: "node", id: 11, tags: { name: "B", shop: "hairdresser" } };
    expect(mapElementToLead(roofer, null)?.industry).toBe("Dachdecker");
    expect(mapElementToLead(hairdresser, null)?.industry).toBe("Friseur");
  });

  it("falls back to a humanized raw tag value when no German label is known", () => {
    const element: OverpassElement = { type: "node", id: 12, tags: { name: "C", shop: "convenience" } };
    expect(mapElementToLead(element, null)?.industry).toBe("Convenience");
  });

  it("excludes non-business infrastructure (parking, benches, parks) even though they can have a name", () => {
    const parking: OverpassElement = { type: "way", id: 13, tags: { name: "P3 Rathaus", amenity: "parking" } };
    const bench: OverpassElement = { type: "node", id: 14, tags: { name: "Aussichtsbank", amenity: "bench" } };
    const park: OverpassElement = { type: "way", id: 15, tags: { name: "Stadtpark", leisure: "park" } };
    expect(mapElementToLead(parking, null)).toBeNull();
    expect(mapElementToLead(bench, null)).toBeNull();
    expect(mapElementToLead(park, null)).toBeNull();
  });

  it("still includes a real business that happens to share the amenity category", () => {
    const dentist: OverpassElement = { type: "node", id: 16, tags: { name: "Dr. Muster", amenity: "dentist" } };
    expect(mapElementToLead(dentist, null)).not.toBeNull();
  });
});
