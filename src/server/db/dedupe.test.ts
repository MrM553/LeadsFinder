import { describe, it, expect } from "vitest";
import { normalizeDomain, buildDedupKey } from "./dedupe";

describe("normalizeDomain", () => {
  it("strips protocol and www", () => {
    expect(normalizeDomain("https://www.beispiel-dach.de")).toBe("beispiel-dach.de");
  });

  it("adds a protocol when missing", () => {
    expect(normalizeDomain("beispiel-dach.de/kontakt")).toBe("beispiel-dach.de");
  });

  it("lowercases the host", () => {
    expect(normalizeDomain("https://WWW.Beispiel-Dach.DE")).toBe("beispiel-dach.de");
  });

  it("returns null for garbage input", () => {
    expect(normalizeDomain("not a url at all :::")).toBeNull();
  });
});

describe("buildDedupKey", () => {
  it("uses the normalized domain when a website is known", () => {
    const key = buildDedupKey({
      websiteUrl: "https://www.Dach-Profi-Rosenheim.de/",
      companyName: "Dach Profi Rosenheim GmbH",
      city: "Rosenheim",
    });
    expect(key).toBe("domain:dach-profi-rosenheim.de");
  });

  it("produces the same key regardless of URL casing/www/path", () => {
    const a = buildDedupKey({
      websiteUrl: "http://dach-profi.de",
      companyName: "X",
      city: "Y",
    });
    const b = buildDedupKey({
      websiteUrl: "https://www.dach-profi.de/impressum",
      companyName: "X",
      city: "Y",
    });
    expect(a).toBe(b);
  });

  it("falls back to normalized name+city when there is no website", () => {
    const key = buildDedupKey({
      websiteUrl: null,
      companyName: "Müller Elektrotechnik",
      city: "München",
    });
    expect(key).toBe("namecity:muller elektrotechnik|munchen");
  });

  it("treats differently-cased/spaced names as the same fallback key", () => {
    const a = buildDedupKey({ websiteUrl: null, companyName: "Sanitär Bayern GmbH", city: "München" });
    const b = buildDedupKey({ websiteUrl: null, companyName: "  sanitär   bayern gmbh  ", city: "münchen" });
    expect(a).toBe(b);
  });

  it("distinguishes leads with the same name in different cities", () => {
    const a = buildDedupKey({ websiteUrl: null, companyName: "Elektriker Meier", city: "München" });
    const b = buildDedupKey({ websiteUrl: null, companyName: "Elektriker Meier", city: "Nürnberg" });
    expect(a).not.toBe(b);
  });
});
