import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { leads, scoringRules, type Lead } from "../db/schema";
import { scoreLead, type LeadSignals } from "./score";
import { ensureDefaultScoringRules } from "./seed-rules";

/** Recomputes and persists a lead's score from its currently-stored signals — no site re-fetch required. */
export function scoreAndSaveLead(leadId: number): Lead {
  ensureDefaultScoringRules();

  const lead = db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) {
    throw new Error(`scoreAndSaveLead: no lead with id ${leadId}`);
  }

  const rules = db.select().from(scoringRules).all();

  const signals: LeadSignals = {
    websiteUrl: lead.websiteUrl,
    websiteStatus: lead.websiteStatus,
    httpsStatus: lead.httpsStatus,
    mobileIndicator: lead.mobileIndicator,
    contactFormDetected: lead.contactFormDetected,
    ctaDetected: lead.ctaDetected,
    phoneDetected: lead.phoneDetected,
    emailDetected: lead.emailDetected,
    responseTimeMs: lead.responseTimeMs,
    hasTitle: lead.hasTitle,
    hasMetaDescription: lead.hasMetaDescription,
    industryMatched: lead.industryMatched,
    // All current discovery is bbox-scoped to the searched location, so any
    // stored lead is location-matched by construction (see CLAUDE.md §9).
    locationMatched: true,
  };

  const result = scoreLead(signals, rules);

  return db
    .update(leads)
    .set({
      overallScore: result.overallScore,
      technicalScore: result.technicalScore,
      performanceScore: result.performanceScore,
      scoreReasons: result.reasons,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId))
    .returning()
    .get();
}
