import { describe, it, expect } from "vitest";
import { parseRobotsRules, isPathAllowed } from "./robots";

const UA = "LeadFinderBot/0.1";

describe("parseRobotsRules + isPathAllowed", () => {
  it("allows everything when robots.txt has no rules for us", () => {
    const rules = parseRobotsRules("User-agent: *\nAllow: /", UA);
    expect(isPathAllowed(rules, "/kontakt")).toBe(true);
  });

  it("disallows a blocked path", () => {
    const rules = parseRobotsRules("User-agent: *\nDisallow: /admin", UA);
    expect(isPathAllowed(rules, "/admin/login")).toBe(false);
    expect(isPathAllowed(rules, "/kontakt")).toBe(true);
  });

  it("longest match wins between Allow and Disallow", () => {
    const rules = parseRobotsRules("User-agent: *\nDisallow: /\nAllow: /kontakt", UA);
    expect(isPathAllowed(rules, "/kontakt")).toBe(true);
    expect(isPathAllowed(rules, "/other")).toBe(false);
  });

  it("prefers a specific user-agent group over the wildcard group", () => {
    const text = "User-agent: LeadFinderBot\nDisallow: /no-bots\n\nUser-agent: *\nDisallow: /\n";
    const rules = parseRobotsRules(text, UA);
    expect(isPathAllowed(rules, "/kontakt")).toBe(true);
    expect(isPathAllowed(rules, "/no-bots")).toBe(false);
  });

  it("treats an entirely empty robots.txt as allow-all", () => {
    expect(isPathAllowed(parseRobotsRules("", UA), "/anything")).toBe(true);
  });
});
