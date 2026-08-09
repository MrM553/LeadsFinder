import { fetchWithTimeout } from "./http";

export interface RobotsRule {
  path: string;
  allow: boolean;
}

interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}

export function parseRobotsRules(text: string, userAgent: string): RobotsRule[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);

  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === "user-agent") {
      // Consecutive User-agent lines (no rules yet) belong to the same group.
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (key === "disallow" && current) {
      if (value !== "") current.rules.push({ path: value, allow: false });
    } else if (key === "allow" && current) {
      if (value !== "") current.rules.push({ path: value, allow: true });
    }
  }

  const uaLower = userAgent.toLowerCase();
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && uaLower.includes(a)));
  const wildcard = groups.filter((g) => g.agents.includes("*"));
  const applicable = specific.length > 0 ? specific : wildcard;
  return applicable.flatMap((g) => g.rules);
}

export function isPathAllowed(rules: RobotsRule[], path: string): boolean {
  let best: RobotsRule | null = null;
  for (const rule of rules) {
    if (path.startsWith(rule.path) && (!best || rule.path.length > best.path.length)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}

/**
 * If robots.txt can't be fetched at all (network error, timeout), we fail
 * open rather than blocking a single polite, low-volume homepage check —
 * a missing/unreachable robots.txt is far more common than a real block,
 * and the homepage fetch itself will separately fail if the site is down.
 */
export async function isAllowedByRobots(targetUrl: string, userAgent: string): Promise<boolean> {
  try {
    const url = new URL(targetUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    const res = await fetchWithTimeout(robotsUrl, { timeoutMs: 5000 });
    if (!res.ok) return true;
    const text = await res.text();
    const rules = parseRobotsRules(text, userAgent);
    return isPathAllowed(rules, url.pathname || "/");
  } catch {
    return true;
  }
}
