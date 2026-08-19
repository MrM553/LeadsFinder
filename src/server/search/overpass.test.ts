import { describe, it, expect } from "vitest";
import { buildOverpassQuery } from "./overpass";

const bbox: [number, number, number, number] = [47.8, 47.9, 12.1, 12.2];

describe("buildOverpassQuery", () => {
  it("builds a tag-filtered query using the bbox in (south,west,north,east) order", () => {
    const query = buildOverpassQuery([{ key: "craft", value: "roofer" }], bbox);
    expect(query).toContain('nwr["craft"="roofer"](47.8,12.1,47.9,12.2);');
    expect(query).toContain("out center tags;");
  });

  it("combines multiple tag filters into separate clauses", () => {
    const query = buildOverpassQuery(
      [
        { key: "craft", value: "roofer" },
        { key: "craft", value: "electrician" },
      ],
      bbox
    );
    expect(query).toContain('nwr["craft"="roofer"]');
    expect(query).toContain('nwr["craft"="electrician"]');
  });

  it("falls back to a name-regex query across a broad category list when no tags matched", () => {
    const query = buildOverpassQuery([], bbox, "Fahrradladen");
    expect(query).toContain('nwr[~"^(shop|craft|office|amenity|healthcare|leisure)$"~"."]["name"~"Fahrradladen",i]');
  });

  it("escapes regex-special characters in the fallback term", () => {
    const query = buildOverpassQuery([], bbox, 'Café "Test" (Bio)');
    expect(query).toContain('Café \\"Test\\" \\(Bio\\)');
  });

  it("builds a broad any-named-business query when no tags and no term are given", () => {
    const query = buildOverpassQuery([], bbox);
    expect(query).toContain('nwr[~"^(shop|craft|office|amenity|healthcare|leisure)$"~"."]["name"](47.8,12.1,47.9,12.2);');
    expect(query).not.toContain("~\",i]");
  });
});
