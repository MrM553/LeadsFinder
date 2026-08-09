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
});
