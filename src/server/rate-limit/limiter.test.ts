import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, _resetRateLimitsForTests } from "./limiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetRateLimitsForTests();
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("key-a", 3, 60_000).allowed).toBe(true);
    }
  });

  it("rejects a request beyond the limit within the window", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("key-b", 3, 60_000);
    const result = checkRateLimit("key-b", 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("key-c1", 3, 60_000);
    expect(checkRateLimit("key-c1", 3, 60_000).allowed).toBe(false);
    expect(checkRateLimit("key-c2", 3, 60_000).allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 2; i++) checkRateLimit("key-d", 2, 1000);
      expect(checkRateLimit("key-d", 2, 1000).allowed).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(checkRateLimit("key-d", 2, 1000).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
