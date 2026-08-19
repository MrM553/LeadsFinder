import { describe, it, expect, vi, afterEach } from "vitest";
import { buildOverpassQuery, runOverpassQuery } from "./overpass";

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

function mockResponse(opts: { ok: boolean; status?: number; elements?: unknown[]; jsonError?: boolean }) {
  return {
    ok: opts.ok,
    status: opts.status ?? 200,
    statusText: "",
    json: async () => {
      if (opts.jsonError) throw new SyntaxError("Unexpected token < in JSON");
      return { elements: opts.elements ?? [] };
    },
  } as Response;
}

describe("runOverpassQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not trust an empty (non-error) response from the first endpoint — falls through to the next", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, elements: [] }))
      .mockResolvedValueOnce(mockResponse({ ok: true, elements: [{ type: "node", id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runOverpassQuery("query");
    expect(result).toEqual([{ type: "node", id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 15000);

  it("accepts an empty result only once every endpoint has been tried", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ ok: true, elements: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runOverpassQuery("query");
    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2); // once per endpoint, no same-endpoint retry for a clean empty response
  }, 15000);

  it("retries a retryable HTTP error on the same endpoint before moving on", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 504 }))
      .mockResolvedValueOnce(mockResponse({ ok: true, elements: [{ type: "node", id: 2 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runOverpassQuery("query");
    expect(result).toEqual([{ type: "node", id: 2 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 15000);

  it("treats a malformed (non-JSON) 200 response as retryable, not a hard failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ ok: true, jsonError: true }))
      .mockResolvedValueOnce(mockResponse({ ok: true, elements: [{ type: "node", id: 3 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runOverpassQuery("query");
    expect(result).toEqual([{ type: "node", id: 3 }]);
  }, 15000);
});
