import { describe, it, expect, vi, beforeEach } from "vitest";
import { discoverLeads, SearchLimitError, CONFIRMATION_THRESHOLD, MAX_LIMIT } from "./discover";

describe("discoverLeads safety limits", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network should never be called for a rejected search");
      })
    );
  });

  it("rejects a limit above the confirmation threshold without allowLarge, before any network call", async () => {
    await expect(
      discoverLeads({ industry: "Dachdecker", location: "Rosenheim", limit: CONFIRMATION_THRESHOLD + 1 })
    ).rejects.toBeInstanceOf(SearchLimitError);
  });

  it("rejects a limit above the product maximum even with allowLarge", async () => {
    await expect(
      discoverLeads({ industry: "Dachdecker", location: "Rosenheim", limit: MAX_LIMIT + 1, allowLarge: true })
    ).rejects.toBeInstanceOf(SearchLimitError);
  });
});
