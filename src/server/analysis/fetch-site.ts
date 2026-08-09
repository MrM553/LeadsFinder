import { fetchWithTimeout } from "./http";
import type { WebsiteStatus } from "@/types/lead";

export interface SiteFetchResult {
  status: Extract<WebsiteStatus, "UP" | "DOWN" | "UNREACHABLE">;
  finalUrl: string | null;
  html: string | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}

const MAX_ATTEMPTS = 2;
const TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2_000_000;

export async function fetchSite(url: string): Promise<SiteFetchResult> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(url, { timeoutMs: TIMEOUT_MS });
      const responseTimeMs = Date.now() - start;

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        if (attempt < MAX_ATTEMPTS) continue;
        return { status: "DOWN", finalUrl: res.url, html: null, responseTimeMs, errorMessage: lastError };
      }

      const fullText = await res.text();
      const html = fullText.slice(0, MAX_HTML_BYTES);
      return { status: "UP", finalUrl: res.url, html, responseTimeMs, errorMessage: null };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) continue;
      return { status: "UNREACHABLE", finalUrl: null, html: null, responseTimeMs: null, errorMessage: lastError };
    }
  }

  return { status: "UNREACHABLE", finalUrl: null, html: null, responseTimeMs: null, errorMessage: lastError };
}
