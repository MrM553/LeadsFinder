export type ScoringRuleCategory = "existence" | "technical" | "relevance";

export interface DefaultScoringRule {
  key: string;
  label: string;
  description: string;
  points: number;
  category: ScoringRuleCategory;
}

/**
 * Default scoring rules, additive out of 100. Stored in the `scoring_rules`
 * table so they can be tuned later without a code change (CLAUDE.md §3/§9).
 * Each rule contributes its points when satisfied; when not satisfied it
 * contributes 0 and still shows up as a reason (see src/server/scoring/score.ts).
 */
export const DEFAULT_SCORING_RULES: DefaultScoringRule[] = [
  {
    key: "has_website",
    label: "Has a website",
    description: "The business has a discoverable website URL.",
    points: 15,
    category: "existence",
  },
  {
    key: "website_reachable",
    label: "Website is reachable",
    description: "The website responded successfully when checked.",
    points: 8,
    category: "existence",
  },
  {
    key: "https_present",
    label: "HTTPS present",
    description: "The site is served over HTTPS.",
    points: 8,
    category: "technical",
  },
  {
    key: "mobile_friendly",
    label: "Mobile-friendly indicators",
    description: "A viewport meta tag was found, suggesting a responsive/mobile-aware design.",
    points: 8,
    category: "technical",
  },
  {
    key: "contact_form_present",
    label: "Contact form present",
    description: "A contact form with input fields was found on the page.",
    points: 10,
    category: "technical",
  },
  {
    key: "cta_present",
    label: "Clear call-to-action",
    description: "A recognizable German call-to-action phrase was found.",
    points: 8,
    category: "technical",
  },
  {
    key: "phone_detected",
    label: "Phone number found on site",
    description: "A phone number was found on the page (tel: link or in text).",
    points: 5,
    category: "technical",
  },
  {
    key: "email_detected",
    label: "Email address found on site",
    description: "An email address was found on the page (mailto: link or in text).",
    points: 5,
    category: "technical",
  },
  {
    key: "fast_response",
    label: "Fast response time",
    description: "The homepage responded within 1.5 seconds.",
    points: 6,
    category: "technical",
  },
  {
    key: "title_present",
    label: "Page has a title",
    description: "The page has a non-empty <title>.",
    points: 3,
    category: "technical",
  },
  {
    key: "meta_description_present",
    label: "Page has a meta description",
    description: "The page has a non-empty meta description.",
    points: 2,
    category: "technical",
  },
  {
    key: "industry_relevance",
    label: "Target industry",
    description: "This lead was found via a search matching the target industry.",
    points: 12,
    category: "relevance",
  },
  {
    key: "location_relevance",
    label: "Target location",
    description: "This lead was found via a search matching the target location.",
    points: 10,
    category: "relevance",
  },
];
