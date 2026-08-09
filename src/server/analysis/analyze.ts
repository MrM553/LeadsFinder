import { isAllowedByRobots } from "./robots";
import { fetchSite } from "./fetch-site";
import { ANALYSIS_USER_AGENT } from "./http";
import * as detect from "./detectors";
import type { WebsiteStatus } from "@/types/lead";

export interface WebsiteAnalysis {
  websiteStatus: WebsiteStatus;
  httpsStatus: boolean | null;
  mobileIndicator: boolean | null;
  contactFormDetected: boolean | null;
  phoneDetected: boolean | null;
  emailDetected: boolean | null;
  ctaDetected: boolean | null;
  hasTitle: boolean | null;
  hasMetaDescription: boolean | null;
  responseTimeMs: number | null;
  /** Phone/email found on the page — used to fill gaps, never overwrite known data. */
  extractedPhone: string | null;
  extractedEmail: string | null;
  errorMessage: string | null;
}

const EMPTY_ANALYSIS: Omit<WebsiteAnalysis, "websiteStatus" | "errorMessage" | "responseTimeMs"> = {
  httpsStatus: null,
  mobileIndicator: null,
  contactFormDetected: null,
  phoneDetected: null,
  emailDetected: null,
  ctaDetected: null,
  hasTitle: null,
  hasMetaDescription: null,
  extractedPhone: null,
  extractedEmail: null,
};

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  const allowed = await isAllowedByRobots(url, ANALYSIS_USER_AGENT);
  if (!allowed) {
    return {
      websiteStatus: "UNREACHABLE",
      ...EMPTY_ANALYSIS,
      responseTimeMs: null,
      errorMessage: "Disallowed by robots.txt",
    };
  }

  const fetched = await fetchSite(url);
  if (fetched.status !== "UP" || !fetched.html) {
    return {
      websiteStatus: fetched.status,
      ...EMPTY_ANALYSIS,
      responseTimeMs: fetched.responseTimeMs,
      errorMessage: fetched.errorMessage,
    };
  }

  const { html, finalUrl, responseTimeMs } = fetched;
  const phone = detect.detectPhone(html);
  const email = detect.detectEmail(html);

  return {
    websiteStatus: "UP",
    httpsStatus: detect.detectHttps(finalUrl ?? url),
    mobileIndicator: detect.detectMobileIndicator(html),
    contactFormDetected: detect.detectContactForm(html),
    phoneDetected: phone.detected,
    emailDetected: email.detected,
    ctaDetected: detect.detectCta(html),
    hasTitle: detect.detectTitle(html),
    hasMetaDescription: detect.detectMetaDescription(html),
    responseTimeMs,
    extractedPhone: phone.value,
    extractedEmail: email.value,
    errorMessage: null,
  };
}
