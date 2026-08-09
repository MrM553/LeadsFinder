/**
 * Local dev seed data. All companies/domains below are fictional
 * ("Muster..." = German placeholder-name convention) — never real
 * scraped business data. Scores are computed by the real scoring engine
 * from the seeded signals, not hand-typed.
 */
import "./load-env";
import { db } from "./client";
import { leads, searches, notes } from "./schema";
import { upsertLead } from "./leads";
import { scoreAndSaveLead } from "../scoring/apply";
import { ensureDefaultScoringRules } from "../scoring/seed-rules";

async function seed() {
  await ensureDefaultScoringRules();

  const search = db
    .insert(searches)
    .values({
      industry: "Dachdecker",
      location: "Rosenheim",
      requestedCount: 10,
      status: "DONE",
      resultsFound: 3,
    })
    .returning()
    .get();

  const lead1 = await upsertLead({
    companyName: "Musterdach Rosenheim GmbH",
    websiteUrl: "https://www.musterdach-rosenheim.de",
    industry: "Dachdecker",
    city: "Rosenheim",
    region: "Bayern",
    country: "Germany",
    phone: "+49 8031 1234567",
    email: "info@musterdach-rosenheim.de",
    sourceUrl: "https://www.openstreetmap.org/way/000000001",
    foundInSearchId: search.id,
    industryMatched: true,
    lastChecked: new Date(),
    websiteStatus: "UP",
    httpsStatus: true,
    mobileIndicator: true,
    contactFormDetected: true,
    phoneDetected: true,
    emailDetected: true,
    ctaDetected: false,
    responseTimeMs: 450,
    hasTitle: true,
    hasMetaDescription: true,
    status: "NEW",
  });

  const lead2 = await upsertLead({
    companyName: "Beispiel Bedachungen Muster",
    websiteUrl: "https://beispiel-bedachungen-muster.de",
    industry: "Dachdecker",
    city: "Rosenheim",
    region: "Bayern",
    country: "Germany",
    phone: null,
    email: null,
    sourceUrl: "https://www.openstreetmap.org/way/000000002",
    foundInSearchId: search.id,
    industryMatched: true,
    lastChecked: new Date(),
    websiteStatus: "UP",
    httpsStatus: false,
    mobileIndicator: false,
    contactFormDetected: false,
    phoneDetected: false,
    emailDetected: false,
    ctaDetected: false,
    responseTimeMs: 3200,
    hasTitle: true,
    hasMetaDescription: false,
    status: "NEW",
  });

  const lead3 = await upsertLead({
    companyName: "Handwerk Musterhaus",
    websiteUrl: null,
    industry: "Dachdecker",
    city: "Rosenheim",
    region: "Bayern",
    country: "Germany",
    sourceUrl: "https://www.openstreetmap.org/way/000000003",
    foundInSearchId: search.id,
    industryMatched: true,
    websiteStatus: "NO_WEBSITE",
    status: "NEW",
  });

  for (const lead of [lead1, lead2, lead3]) {
    await scoreAndSaveLead(lead.id);
  }

  db.insert(notes)
    .values({
      leadId: lead1.id,
      text: "Called once, no answer yet. Try again next week.",
    })
    .run();

  console.log(`Seeded 1 search and 3 leads (ids: ${lead1.id}, ${lead2.id}, ${lead3.id}).`);
}

async function main() {
  const existing = db.select().from(leads).all();
  if (existing.length > 0) {
    console.log(`Database already has ${existing.length} lead(s); skipping seed.`);
    return;
  }
  await seed();
}

main();
