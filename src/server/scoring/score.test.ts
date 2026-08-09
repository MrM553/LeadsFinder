import { describe, it, expect } from "vitest";
import { scoreLead, computePerformanceScore, type LeadSignals, type ScoringRuleInput } from "./score";
import { DEFAULT_SCORING_RULES } from "./rules";

const RULES: ScoringRuleInput[] = DEFAULT_SCORING_RULES.map((r) => ({
  key: r.key,
  points: r.points,
  enabled: true,
  category: r.category,
}));

const PERFECT_SIGNALS: LeadSignals = {
  websiteUrl: "https://example.de",
  websiteStatus: "UP",
  httpsStatus: true,
  mobileIndicator: true,
  contactFormDetected: true,
  ctaDetected: true,
  phoneDetected: true,
  emailDetected: true,
  responseTimeMs: 400,
  hasTitle: true,
  hasMetaDescription: true,
  industryMatched: true,
  locationMatched: true,
};

const NO_WEBSITE_SIGNALS: LeadSignals = {
  websiteUrl: null,
  websiteStatus: "NO_WEBSITE",
  httpsStatus: null,
  mobileIndicator: null,
  contactFormDetected: null,
  ctaDetected: null,
  phoneDetected: null,
  emailDetected: null,
  responseTimeMs: null,
  hasTitle: null,
  hasMetaDescription: null,
  industryMatched: true,
  locationMatched: true,
};

describe("scoreLead", () => {
  it("scores a perfect lead at exactly 100", () => {
    const result = scoreLead(PERFECT_SIGNALS, RULES);
    expect(result.overallScore).toBe(100);
    expect(result.technicalScore).toBe(100);
    expect(result.performanceScore).toBe(100);
  });

  it("scores a lead with no website much lower, with only existence-independent rules applying", () => {
    const result = scoreLead(NO_WEBSITE_SIGNALS, RULES);
    // industry_relevance (12) + location_relevance (10) only
    expect(result.overallScore).toBe(22);
    expect(result.technicalScore).toBe(0);
    expect(result.performanceScore).toBe(0);
  });

  it("never exceeds 100 or drops below 0", () => {
    const result = scoreLead(PERFECT_SIGNALS, RULES);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("includes a reason for every applicable rule, met or missed", () => {
    const partial: LeadSignals = {
      ...PERFECT_SIGNALS,
      ctaDetected: false,
      contactFormDetected: false,
      mobileIndicator: false,
    };
    const result = scoreLead(partial, RULES);
    const labels = result.reasons.map((r) => r.label);
    expect(labels).toContain("No clear CTA");
    expect(labels).toContain("No contact form");
    expect(labels).toContain("Poor mobile indicators");
    expect(labels).toContain("HTTPS present");
  });

  it("does not include page-level reasons when the website is unreachable", () => {
    const down: LeadSignals = { ...PERFECT_SIGNALS, websiteStatus: "DOWN" };
    const result = scoreLead(down, RULES);
    const labels = result.reasons.map((r) => r.label);
    expect(labels).not.toContain("HTTPS present");
    expect(labels).not.toContain("HTTPS missing");
    expect(labels).toContain("Website unavailable");
  });

  it("respects a disabled rule by omitting it entirely and not scoring its points", () => {
    const rulesWithCtaDisabled = RULES.map((r) => (r.key === "cta_present" ? { ...r, enabled: false } : r));
    const result = scoreLead(PERFECT_SIGNALS, rulesWithCtaDisabled);
    expect(result.reasons.some((r) => r.label.toLowerCase().includes("cta"))).toBe(false);
    expect(result.overallScore).toBe(100 - 8); // cta_present is worth 8
  });

  it("respects a re-weighted rule's custom point value", () => {
    const rulesWithHigherHttpsWeight = RULES.map((r) => (r.key === "https_present" ? { ...r, points: 20 } : r));
    const result = scoreLead(PERFECT_SIGNALS, rulesWithHigherHttpsWeight);
    const httpsReason = result.reasons.find((r) => r.label === "HTTPS present");
    expect(httpsReason?.points).toBe(20);
  });

  it("gives industry_relevance and location_relevance reasons even without a website", () => {
    const result = scoreLead(NO_WEBSITE_SIGNALS, RULES);
    expect(result.reasons).toContainEqual({ label: "Target industry", points: 12 });
    expect(result.reasons).toContainEqual({ label: "Target location", points: 10 });
  });

  it("flags uncertain industry match when discovery fell back to a name search", () => {
    const fuzzy: LeadSignals = { ...PERFECT_SIGNALS, industryMatched: false };
    const result = scoreLead(fuzzy, RULES);
    expect(result.reasons).toContainEqual({ label: "Industry match uncertain", points: 0 });
  });
});

describe("computePerformanceScore", () => {
  it("returns 0 when the site is not up", () => {
    expect(computePerformanceScore("DOWN", 200)).toBe(0);
    expect(computePerformanceScore("UP", null)).toBe(0);
  });

  it("grades response time on a descending scale", () => {
    expect(computePerformanceScore("UP", 400)).toBe(100);
    expect(computePerformanceScore("UP", 1200)).toBe(80);
    expect(computePerformanceScore("UP", 2500)).toBe(50);
    expect(computePerformanceScore("UP", 5000)).toBe(25);
    expect(computePerformanceScore("UP", 9000)).toBe(10);
  });
});
