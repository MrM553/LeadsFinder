import { describe, it, expect } from "vitest";
import {
  detectHttps,
  detectMobileIndicator,
  detectContactForm,
  detectPhone,
  detectEmail,
  detectCta,
  detectTitle,
  detectMetaDescription,
} from "./detectors";

describe("detectHttps", () => {
  it("true for https urls", () => expect(detectHttps("https://example.de")).toBe(true));
  it("false for http urls", () => expect(detectHttps("http://example.de")).toBe(false));
});

describe("detectMobileIndicator", () => {
  it("detects a viewport meta tag", () => {
    expect(detectMobileIndicator('<meta name="viewport" content="width=device-width">')).toBe(true);
  });
  it("false when absent", () => {
    expect(detectMobileIndicator("<html><head></head></html>")).toBe(false);
  });
});

describe("detectContactForm", () => {
  it("detects a form with an input", () => {
    expect(detectContactForm('<form action="/kontakt"><input type="email"></form>')).toBe(true);
  });
  it("false for a form with no inputs (e.g. a search-only wrapper)", () => {
    expect(detectContactForm("<form></form>")).toBe(false);
  });
  it("false when there is no form at all", () => {
    expect(detectContactForm("<div>Kontaktieren Sie uns per Telefon</div>")).toBe(false);
  });
});

describe("detectPhone", () => {
  it("prefers a tel: link", () => {
    const result = detectPhone('<a href="tel:+498031123456">Anrufen</a>');
    expect(result).toEqual({ detected: true, value: "+498031123456" });
  });
  it("finds a German phone number in text", () => {
    const result = detectPhone("<p>Rufen Sie uns an: 08031 123456</p>");
    expect(result.detected).toBe(true);
  });
  it("no false positive on plain text with no phone", () => {
    expect(detectPhone("<p>Wir sind ein Familienbetrieb seit 1998.</p>").detected).toBe(false);
  });
});

describe("detectEmail", () => {
  it("prefers a mailto: link", () => {
    const result = detectEmail('<a href="mailto:info@beispiel.de">Mail</a>');
    expect(result).toEqual({ detected: true, value: "info@beispiel.de" });
  });
  it("finds an email address in text", () => {
    expect(detectEmail("<p>Kontakt: info@beispiel.de</p>").detected).toBe(true);
  });
  it("no false positive when there is no email", () => {
    expect(detectEmail("<p>Kein Kontakt hier.</p>").detected).toBe(false);
  });
});

describe("detectCta", () => {
  it("detects a known German CTA phrase", () => {
    expect(detectCta("<button>Jetzt anrufen</button>")).toBe(true);
  });
  it("false when no CTA phrase is present", () => {
    expect(detectCta("<p>Über uns: gegründet 1998.</p>")).toBe(false);
  });
});

describe("detectTitle / detectMetaDescription", () => {
  it("detects a non-empty title", () => {
    expect(detectTitle("<title>Musterdach GmbH</title>")).toBe(true);
  });
  it("false for an empty title", () => {
    expect(detectTitle("<title></title>")).toBe(false);
  });
  it("detects a meta description", () => {
    expect(detectMetaDescription('<meta name="description" content="Wir sind Dachdecker in Rosenheim">')).toBe(true);
  });
  it("false when meta description is missing", () => {
    expect(detectMetaDescription("<head></head>")).toBe(false);
  });
});
