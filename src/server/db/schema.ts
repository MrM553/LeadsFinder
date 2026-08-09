import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import type { LeadStatus, WebsiteStatus, SearchStatus, ScoreReason } from "@/types/lead";

export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  requestedCount: integer("requested_count").notNull(),
  status: text("status").$type<SearchStatus>().notNull().default("QUEUED"),
  resultsFound: integer("results_found").notNull().default(0),
  // Analysis/scoring processing progress — distinct from `status`, which
  // only tracks the discovery phase (see CLAUDE.md's search-jobs notes).
  resultsProcessed: integer("results_processed").notNull().default(0),
  resultsFailed: integer("results_failed").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // dedup key: normalized website domain, or normalized "name|city" when no domain
  dedupKey: text("dedup_key").notNull().unique(),

  companyName: text("company_name").notNull(),
  websiteUrl: text("website_url"),
  industry: text("industry").notNull(),
  city: text("city"),
  region: text("region"),
  country: text("country").notNull().default("Germany"),

  phone: text("phone"),
  email: text("email"),

  sourceUrl: text("source_url"),
  foundInSearchId: integer("found_in_search_id").references(() => searches.id),
  // Whether discovery matched a known industry tag (true) or fell back to a
  // generic name-regex query (false) — feeds the industry_relevance scoring rule.
  industryMatched: integer("industry_matched", { mode: "boolean" }).notNull().default(true),
  dateFound: integer("date_found", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  lastChecked: integer("last_checked", { mode: "timestamp" }),

  websiteStatus: text("website_status").$type<WebsiteStatus>().notNull().default("UNKNOWN"),
  httpsStatus: integer("https_status", { mode: "boolean" }),
  mobileIndicator: integer("mobile_indicator", { mode: "boolean" }),
  contactFormDetected: integer("contact_form_detected", { mode: "boolean" }),
  phoneDetected: integer("phone_detected", { mode: "boolean" }),
  emailDetected: integer("email_detected", { mode: "boolean" }),
  ctaDetected: integer("cta_detected", { mode: "boolean" }),

  // Raw analysis signals, kept so scoring can be recomputed later without
  // re-fetching the site (see CLAUDE.md §9).
  responseTimeMs: integer("response_time_ms"),
  hasTitle: integer("has_title", { mode: "boolean" }),
  hasMetaDescription: integer("has_meta_description", { mode: "boolean" }),

  technicalScore: real("technical_score"),
  performanceScore: real("performance_score"),
  overallScore: real("overall_score"),
  scoreReasons: text("score_reasons", { mode: "json" }).$type<ScoreReason[]>(),

  status: text("status").$type<LeadStatus>().notNull().default("NEW"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const scoringRules = sqliteTable("scoring_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  category: text("category").$type<"existence" | "technical" | "relevance">().notNull(),
  points: integer("points").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Search = typeof searches.$inferSelect;
export type NewSearch = typeof searches.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type ScoringRule = typeof scoringRules.$inferSelect;
