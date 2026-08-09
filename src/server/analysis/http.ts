import { createThrottle } from "../search/rate-limit";

export const ANALYSIS_USER_AGENT =
  "LeadFinderBot/0.1 (+internal lead-research tool; single-page fetch only; respects robots.txt)";

// Be a polite, low-volume client — this is not a crawler.
const throttle = createThrottle(500);

export async function fetchWithTimeout(url: string, opts: { timeoutMs: number }): Promise<Response> {
  await throttle();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    return await fetch(url, {
      headers: { "User-Agent": ANALYSIS_USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
