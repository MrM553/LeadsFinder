export const LEAD_STATUSES = [
  "NEW",
  "REVIEWED",
  "QUALIFIED",
  "CONTACTED",
  "FOLLOW_UP",
  "CALL_BOOKED",
  "PROPOSAL",
  "WON",
  "LOST",
  "NOT_RELEVANT",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const WEBSITE_STATUSES = [
  "UNKNOWN",
  "UP",
  "DOWN",
  "UNREACHABLE",
  "NO_WEBSITE",
] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const SEARCH_STATUSES = [
  "QUEUED",
  "RUNNING",
  "DONE",
  "FAILED",
] as const;
export type SearchStatus = (typeof SEARCH_STATUSES)[number];

export interface ScoreReason {
  label: string;
  points: number;
}
