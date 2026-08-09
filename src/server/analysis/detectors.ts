/**
 * Pure, heuristic HTML detectors. These are intentionally simple regex/text
 * checks, not a full DOM parse — good enough for a lead-quality signal, not
 * claimed to be exhaustive. Documented as heuristics in CLAUDE.md §... scoring.
 */

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

export function detectHttps(finalUrl: string): boolean {
  return finalUrl.startsWith("https://");
}

export function detectMobileIndicator(html: string): boolean {
  return /<meta[^>]+name=["']viewport["']/i.test(html);
}

export function detectContactForm(html: string): boolean {
  const forms = html.match(/<form[\s\S]*?<\/form>/gi) ?? [];
  return forms.some((form) => /<input|<textarea/i.test(form));
}

const PHONE_REGEX = /(?:\+49[\s\-/]?|\b0)(?:[\s\-/]?\d){8,14}/g;

export function detectPhone(html: string): { detected: boolean; value: string | null } {
  const telLink = html.match(/href=["']tel:([^"']+)["']/i);
  if (telLink) return { detected: true, value: telLink[1].trim() };

  const text = stripTags(html);
  const match = text.match(PHONE_REGEX);
  return { detected: !!match, value: match ? match[0].trim() : null };
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function detectEmail(html: string): { detected: boolean; value: string | null } {
  const mailtoLink = html.match(/href=["']mailto:([^"'?]+)["']/i);
  if (mailtoLink) return { detected: true, value: decodeURIComponent(mailtoLink[1]).trim() };

  const text = stripTags(html);
  const match = text.match(EMAIL_REGEX);
  return { detected: !!match, value: match ? match[0].trim() : null };
}

const CTA_PHRASES = [
  "jetzt anrufen",
  "jetzt buchen",
  "jetzt anfragen",
  "angebot anfordern",
  "kostenlos anfragen",
  "termin vereinbaren",
  "kontaktieren sie uns",
  "jetzt kontaktieren",
  "beratungstermin",
  "jetzt starten",
  "anfrage senden",
  "jetzt bewerben",
  "rufen sie uns an",
  "schreiben sie uns",
];

export function detectCta(html: string): boolean {
  const text = stripTags(html).toLowerCase();
  return CTA_PHRASES.some((phrase) => text.includes(phrase));
}

export function detectTitle(html: string): boolean {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return !!match && match[1].trim().length > 0;
}

export function detectMetaDescription(html: string): boolean {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  return !!match && match[1].trim().length > 0;
}
