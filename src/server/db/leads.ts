import { eq } from "drizzle-orm";
import { getDb } from "./get-db";
import { leads, type NewLead, type Lead } from "./schema";
import { buildDedupKey } from "./dedupe";
import type { WebsiteAnalysis } from "../analysis/analyze";
import type { LeadStatus } from "@/types/lead";

export type LeadDiscoveryInput = Omit<NewLead, "dedupKey" | "id" | "createdAt" | "updatedAt"> & {
  companyName: string;
};

/**
 * Insert a newly discovered lead, or update the existing one with the same
 * dedup key (same domain, or same normalized name+city with no domain).
 * Never overwrites an existing non-null field with null.
 */
export async function upsertLead(input: LeadDiscoveryInput): Promise<Lead> {
  const db = await getDb();
  const dedupKey = buildDedupKey({
    websiteUrl: input.websiteUrl,
    companyName: input.companyName,
    city: input.city,
  });

  const existing = await db.select().from(leads).where(eq(leads.dedupKey, dedupKey)).get();

  if (!existing) {
    return db
      .insert(leads)
      .values({ ...input, dedupKey })
      .returning()
      .get();
  }

  const merged: Partial<NewLead> = {};
  for (const [key, value] of Object.entries(input) as [keyof NewLead, unknown][]) {
    if (value !== null && value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  merged.updatedAt = new Date();

  return db.update(leads).set(merged).where(eq(leads.id, existing.id)).returning().get();
}

/**
 * Writes analysis results onto an existing lead. Detection flags/signals are
 * always overwritten with the latest check; phone/email extracted from the
 * page only fill a gap — they never overwrite a value already on the lead.
 */
export async function applyAnalysisToLead(leadId: number, analysis: WebsiteAnalysis): Promise<Lead> {
  const db = await getDb();
  const existing = await db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!existing) {
    throw new Error(`applyAnalysisToLead: no lead with id ${leadId}`);
  }

  return db
    .update(leads)
    .set({
      websiteStatus: analysis.websiteStatus,
      httpsStatus: analysis.httpsStatus,
      mobileIndicator: analysis.mobileIndicator,
      contactFormDetected: analysis.contactFormDetected,
      phoneDetected: analysis.phoneDetected,
      emailDetected: analysis.emailDetected,
      ctaDetected: analysis.ctaDetected,
      responseTimeMs: analysis.responseTimeMs,
      hasTitle: analysis.hasTitle,
      hasMetaDescription: analysis.hasMetaDescription,
      phone: existing.phone ?? analysis.extractedPhone,
      email: existing.email ?? analysis.extractedEmail,
      lastChecked: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId))
    .returning()
    .get();
}

export async function getLeadById(leadId: number): Promise<Lead | undefined> {
  const db = await getDb();
  return db.select().from(leads).where(eq(leads.id, leadId)).get();
}

export async function updateLeadStatus(leadId: number, status: LeadStatus): Promise<Lead> {
  const db = await getDb();
  return db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, leadId))
    .returning()
    .get();
}
