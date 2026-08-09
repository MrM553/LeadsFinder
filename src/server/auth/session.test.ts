import { describe, it, expect, vi } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

const SECRET = "test-secret-at-least-16-chars";

describe("createSessionToken / verifySessionToken", () => {
  it("verifies a freshly created token", () => {
    const token = createSessionToken("admin", SECRET);
    const result = verifySessionToken(token, SECRET);
    expect(result).toEqual({ username: "admin" });
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken("admin", SECRET);
    expect(verifySessionToken(token, "a-completely-different-secret")).toBeNull();
  });

  it("rejects a tampered payload (username swapped)", () => {
    const token = createSessionToken("admin", SECRET);
    const [, expires, signature] = token.split(".");
    const tampered = `attacker.${expires}.${signature}`;
    expect(verifySessionToken(tampered, SECRET)).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(verifySessionToken("not-a-real-token", SECRET)).toBeNull();
    expect(verifySessionToken("", SECRET)).toBeNull();
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const token = createSessionToken("admin", SECRET);

      vi.setSystemTime(new Date("2026-01-09T00:00:00Z")); // 8 days later, past the 7-day expiry
      expect(verifySessionToken(token, SECRET)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
