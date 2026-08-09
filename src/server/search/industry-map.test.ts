import { describe, it, expect } from "vitest";
import { resolveIndustryTags } from "./industry-map";

describe("resolveIndustryTags", () => {
  it("maps a known German trade term to OSM tags", () => {
    const result = resolveIndustryTags("Dachdecker");
    expect(result.matched).toBe(true);
    expect(result.tags).toEqual([{ key: "craft", value: "roofer" }]);
  });

  it("is case-insensitive and umlaut-tolerant", () => {
    const result = resolveIndustryTags("SANITÄR");
    expect(result.matched).toBe(true);
    expect(result.tags).toEqual([{ key: "craft", value: "plumber" }]);
  });

  it("maps the generic 'Handwerker' term to multiple crafts", () => {
    const result = resolveIndustryTags("Handwerker");
    expect(result.matched).toBe(true);
    expect(result.tags.length).toBeGreaterThan(3);
  });

  it("falls back gracefully for an unmapped term", () => {
    const result = resolveIndustryTags("Fahrradladen");
    expect(result.matched).toBe(false);
    expect(result.tags).toEqual([]);
  });

  it("maps newly-added terms outside the original trades list", () => {
    expect(resolveIndustryTags("Zahnarzt")).toEqual({
      matched: true,
      tags: [{ key: "amenity", value: "dentist" }],
    });
    expect(resolveIndustryTags("Friseur")).toEqual({
      matched: true,
      tags: [{ key: "shop", value: "hairdresser" }],
    });
    expect(resolveIndustryTags("Fahrschule")).toEqual({
      matched: true,
      tags: [{ key: "amenity", value: "driving_school" }],
    });
  });

  it("ignores spaces/punctuation when normalizing", () => {
    const result = resolveIndustryTags("Kfz-Werkstatt");
    expect(result.matched).toBe(true);
    expect(result.tags).toEqual([{ key: "shop", value: "car_repair" }]);
  });
});
