/**
 * Deduplication key rules (see CLAUDE.md §9):
 * - If a website URL is known, the key is the normalized domain (lowercased,
 *   "www." stripped, no path/query/port).
 * - Otherwise, the key falls back to normalized "company name|city".
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeDomain(url: string): string | null {
  try {
    const withProtocol = /^[a-zA-Z]+:\/\//.test(url) ? url : `https://${url}`;
    const host = new URL(withProtocol).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildDedupKey(input: {
  websiteUrl?: string | null;
  companyName: string;
  city?: string | null;
}): string {
  if (input.websiteUrl) {
    const domain = normalizeDomain(input.websiteUrl);
    if (domain) return `domain:${domain}`;
  }
  const name = normalizeText(input.companyName);
  const city = input.city ? normalizeText(input.city) : "";
  return `namecity:${name}|${city}`;
}
