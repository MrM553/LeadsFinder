import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { searches, leads } from "../db/schema";
import { upsertLead } from "../db/leads";
import { processLeadsForSearch } from "./process-leads";

vi.mock("../analysis/analyze", () => ({
  analyzeWebsite: vi.fn(async (url: string) => {
    if (url.includes("broken")) throw new Error("simulated network failure");
    return {
      websiteStatus: "UP",
      httpsStatus: true,
      mobileIndicator: true,
      contactFormDetected: true,
      ctaDetected: true,
      phoneDetected: true,
      emailDetected: true,
      hasTitle: true,
      hasMetaDescription: true,
      responseTimeMs: 300,
      extractedPhone: null,
      extractedEmail: null,
      errorMessage: null,
    };
  }),
}));

describe("processLeadsForSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isolates a per-lead failure — one broken lead doesn't stop the batch", async () => {
    const search = db
      .insert(searches)
      .values({ industry: "Testberuf", location: "Teststadt", requestedCount: 3 })
      .returning()
      .get();

    const good1 = await upsertLead({
      companyName: "Process Test Good 1",
      websiteUrl: "https://good1.example.de",
      industry: "Testberuf",
    });
    const bad = await upsertLead({
      companyName: "Process Test Broken",
      websiteUrl: "https://broken.example.de",
      industry: "Testberuf",
    });
    const good2 = await upsertLead({
      companyName: "Process Test Good 2",
      websiteUrl: "https://good2.example.de",
      industry: "Testberuf",
    });

    await processLeadsForSearch(search.id, [good1.id, bad.id, good2.id]);

    const updatedSearch = db.select().from(searches).where(eq(searches.id, search.id)).get();
    expect(updatedSearch?.resultsProcessed).toBe(3);
    expect(updatedSearch?.resultsFailed).toBe(1);

    const goodLead1 = db.select().from(leads).where(eq(leads.id, good1.id)).get();
    const brokenLead = db.select().from(leads).where(eq(leads.id, bad.id)).get();
    const goodLead2 = db.select().from(leads).where(eq(leads.id, good2.id)).get();

    expect(goodLead1?.overallScore).not.toBeNull();
    expect(goodLead2?.overallScore).not.toBeNull();
    // The broken lead's analysis failed, but it should still get scored
    // from whatever signals it already had (none in this case).
    expect(brokenLead?.websiteStatus).toBe("UNKNOWN");
  });

  it("processes leads with no website without calling analyzeWebsite", async () => {
    const search = db
      .insert(searches)
      .values({ industry: "Testberuf", location: "Teststadt", requestedCount: 1 })
      .returning()
      .get();

    const noWebsite = await upsertLead({
      companyName: "Process Test No Website",
      websiteUrl: null,
      industry: "Testberuf",
      websiteStatus: "NO_WEBSITE",
    });

    await processLeadsForSearch(search.id, [noWebsite.id]);

    const updatedSearch = db.select().from(searches).where(eq(searches.id, search.id)).get();
    expect(updatedSearch?.resultsProcessed).toBe(1);
    expect(updatedSearch?.resultsFailed).toBe(0);

    const lead = db.select().from(leads).where(eq(leads.id, noWebsite.id)).get();
    expect(lead?.overallScore).not.toBeNull();
  });
});
