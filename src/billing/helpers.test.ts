import { describe, expect, it } from "bun:test";

import { DEFAULT_CREDIT_COGS_MARKUP, creditsFromCostCents } from "./helpers";

describe("creditsFromCostCents", () => {
  it("defaults to the fleet markup (2.0)", () => {
    expect(DEFAULT_CREDIT_COGS_MARKUP).toBe(2);
    // 1.4 cents * 2.0 -> ceil -> 3
    expect(creditsFromCostCents(1.4)).toBe(3);
  });

  it("applies an explicit markup", () => {
    expect(creditsFromCostCents(5, 1)).toBe(5);
    expect(creditsFromCostCents(5, 2)).toBe(10);
    expect(creditsFromCostCents(5, 1.5)).toBe(8); // ceil(7.5)
  });

  it("rounds up so any nonzero cost charges at least one credit", () => {
    expect(creditsFromCostCents(0.01, 1)).toBe(1);
  });

  it("charges zero credits for zero or negative cost", () => {
    expect(creditsFromCostCents(0)).toBe(0);
    expect(creditsFromCostCents(-5)).toBe(0);
  });

  it("charges zero when the markup is non-positive", () => {
    expect(creditsFromCostCents(5, 0)).toBe(0);
  });
});
