import { eq } from "drizzle-orm";
import { db } from "./client";
import { leads, type NewLead } from "./schema";
import { buildDedupKey } from "./dedupe";

export type LeadDiscoveryInput = Omit<NewLead, "dedupKey" | "id" | "createdAt" | "updatedAt"> & {
  companyName: string;
};

/**
 * Insert a newly discovered lead, or update the existing one with the same
 * dedup key (same domain, or same normalized name+city with no domain).
 * Never overwrites an existing non-null field with null.
 */
export function upsertLead(input: LeadDiscoveryInput) {
  const dedupKey = buildDedupKey({
    websiteUrl: input.websiteUrl,
    companyName: input.companyName,
    city: input.city,
  });

  const existing = db.select().from(leads).where(eq(leads.dedupKey, dedupKey)).get();

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
