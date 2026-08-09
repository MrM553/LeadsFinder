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
});
