import type { WebsiteStatus, ScoreReason } from "@/types/lead";
import type { ScoringRuleCategory } from "./rules";

export interface ScoringRuleInput {
  key: string;
  points: number;
  enabled: boolean;
  category: ScoringRuleCategory;
}

export interface LeadSignals {
  websiteUrl: string | null;
  websiteStatus: WebsiteStatus;
  httpsStatus: boolean | null;
  mobileIndicator: boolean | null;
  contactFormDetected: boolean | null;
  ctaDetected: boolean | null;
  phoneDetected: boolean | null;
  emailDetected: boolean | null;
  responseTimeMs: number | null;
  hasTitle: boolean | null;
  hasMetaDescription: boolean | null;
  industryMatched: boolean;
  locationMatched: boolean;
}

export interface ScoreResult {
  overallScore: number;
  technicalScore: number;
  performanceScore: number;
  reasons: ScoreReason[];
}

const FAST_RESPONSE_THRESHOLD_MS = 1500;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Graded performance score from raw response time. Kept independent of the
 * configurable rule weights so it stays a stable, comparable 0-100 gauge
 * even if the user retunes scoring_rules.
 */
export function computePerformanceScore(websiteStatus: WebsiteStatus, responseTimeMs: number | null): number {
  if (websiteStatus !== "UP" || responseTimeMs === null) return 0;
  if (responseTimeMs <= 800) return 100;
  if (responseTimeMs <= 1500) return 80;
  if (responseTimeMs <= 3000) return 50;
  if (responseTimeMs <= 6000) return 25;
  return 10;
}

/**
 * Additive, transparent scoring: each enabled rule contributes its
 * configured points when satisfied, 0 when not — and every rule (met or
 * missed) shows up as a reason. See CLAUDE.md's lead-scoring principles.
 */
export function scoreLead(signals: LeadSignals, rules: ScoringRuleInput[]): ScoreResult {
  const ruleMap = new Map(rules.filter((r) => r.enabled).map((r) => [r.key, r]));
  const reasons: ScoreReason[] = [];

  let overallTotal = 0;
  let technicalEarned = 0;
  let technicalMax = 0;

  function apply(key: string, satisfied: boolean, positiveLabel: string, negativeLabel: string) {
    const rule = ruleMap.get(key);
    if (!rule) return;
    if (rule.category === "technical") technicalMax += rule.points;
    if (satisfied) {
      overallTotal += rule.points;
      if (rule.category === "technical") technicalEarned += rule.points;
      reasons.push({ label: positiveLabel, points: rule.points });
    } else {
      reasons.push({ label: negativeLabel, points: 0 });
    }
  }

  const hasWebsite = signals.websiteStatus !== "NO_WEBSITE" && !!signals.websiteUrl;
  apply("has_website", hasWebsite, "Has a website", "No website");

  if (hasWebsite) {
    const reachable = signals.websiteStatus === "UP";
    apply("website_reachable", reachable, "Website is reachable", "Website unavailable");

    if (reachable) {
      apply("https_present", signals.httpsStatus === true, "HTTPS present", "HTTPS missing");
      apply(
        "mobile_friendly",
        signals.mobileIndicator === true,
        "Mobile-friendly indicators",
        "Poor mobile indicators"
      );
      apply(
        "contact_form_present",
        signals.contactFormDetected === true,
        "Contact form present",
        "No contact form"
      );
      apply("cta_present", signals.ctaDetected === true, "Clear call-to-action", "No clear CTA");
      apply(
        "phone_detected",
        signals.phoneDetected === true,
        "Phone number found on site",
        "No phone number found on site"
      );
      apply(
        "email_detected",
        signals.emailDetected === true,
        "Email address found on site",
        "No email address found on site"
      );
      const fast = signals.responseTimeMs !== null && signals.responseTimeMs <= FAST_RESPONSE_THRESHOLD_MS;
      apply("fast_response", fast, "Fast response time", "Slow response time");
      apply("title_present", signals.hasTitle === true, "Page has a title", "Missing page title");
      apply(
        "meta_description_present",
        signals.hasMetaDescription === true,
        "Page has a meta description",
        "Missing meta description"
      );
    }
  }

  apply("industry_relevance", signals.industryMatched, "Target industry", "Industry match uncertain");
  apply("location_relevance", signals.locationMatched, "Target location", "Location match uncertain");

  const overallScore = clamp(Math.round(overallTotal));
  const technicalScore =
    hasWebsite && signals.websiteStatus === "UP" && technicalMax > 0
      ? clamp(Math.round((technicalEarned / technicalMax) * 100))
      : 0;
  const performanceScore = computePerformanceScore(signals.websiteStatus, signals.responseTimeMs);

  return { overallScore, technicalScore, performanceScore, reasons };
}
