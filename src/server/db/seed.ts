/**
 * Local dev seed data. All companies/domains below are fictional
 * ("Muster..." = German placeholder-name convention) — never real
 * scraped business data.
 */
import { db } from "./client";
import { leads, searches, notes } from "./schema";
import { upsertLead } from "./leads";

function seed() {
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

  const lead1 = upsertLead({
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
    lastChecked: new Date(),
    websiteStatus: "UP",
    httpsStatus: true,
    mobileIndicator: true,
    contactFormDetected: true,
    phoneDetected: true,
    emailDetected: true,
    ctaDetected: false,
    technicalScore: 78,
    performanceScore: 65,
    overallScore: 71,
    scoreReasons: [
      { label: "Target industry", points: 10 },
      { label: "No clear CTA", points: -8 },
      { label: "HTTPS present", points: 5 },
    ],
    status: "NEW",
  });

  const lead2 = upsertLead({
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
    lastChecked: new Date(),
    websiteStatus: "UP",
    httpsStatus: false,
    mobileIndicator: false,
    contactFormDetected: false,
    phoneDetected: false,
    emailDetected: false,
    ctaDetected: false,
    technicalScore: 22,
    performanceScore: 40,
    overallScore: 28,
    scoreReasons: [
      { label: "HTTPS missing", points: -15 },
      { label: "No contact form", points: -10 },
      { label: "Poor mobile indicators", points: -10 },
      { label: "Target industry", points: 10 },
    ],
    status: "NEW",
  });

  const lead3 = upsertLead({
    companyName: "Handwerk Musterhaus",
    websiteUrl: null,
    industry: "Dachdecker",
    city: "Rosenheim",
    region: "Bayern",
    country: "Germany",
    sourceUrl: "https://www.openstreetmap.org/way/000000003",
    foundInSearchId: search.id,
    websiteStatus: "NO_WEBSITE",
    technicalScore: 0,
    performanceScore: 0,
    overallScore: 5,
    scoreReasons: [
      { label: "No website", points: -30 },
      { label: "Target industry", points: 10 },
    ],
    status: "NEW",
  });

  db.insert(notes)
    .values({
      leadId: lead1.id,
      text: "Called once, no answer yet. Try again next week.",
    })
    .run();

  console.log(`Seeded 1 search and 3 leads (ids: ${lead1.id}, ${lead2.id}, ${lead3.id}).`);
}

function main() {
  const existing = db.select().from(leads).all();
  if (existing.length > 0) {
    console.log(`Database already has ${existing.length} lead(s); skipping seed.`);
    return;
  }
  seed();
}

main();
