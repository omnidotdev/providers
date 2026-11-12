import { describe, expect, it } from "bun:test";

import { createSpendBreaker, utcDayKey } from "./spendBreaker";

const DAY_1 = Date.parse("2026-11-11T08:00:00Z");
const DAY_1_LATER = Date.parse("2026-11-11T23:59:00Z");
const DAY_2 = Date.parse("2026-11-12T00:01:00Z");

describe("utcDayKey", () => {
  it("returns the UTC calendar day", () => {
    expect(utcDayKey(DAY_1)).toBe("2026-11-11");
    expect(utcDayKey(DAY_2)).toBe("2026-11-12");
  });
});

describe("createSpendBreaker", () => {
  it("accumulates recorded spend within a UTC day", async () => {
    const breaker = createSpendBreaker(500);
    await breaker.record(100, DAY_1);
    await breaker.record(50, DAY_1_LATER);
    expect(await breaker.spentTodayCents(DAY_1_LATER)).toBe(150);
  });

  it("trips once spend reaches the ceiling", async () => {
    const breaker = createSpendBreaker(500);
    await breaker.record(499, DAY_1);
    expect(await breaker.isTripped(DAY_1)).toBe(false);
    await breaker.record(1, DAY_1);
    expect(await breaker.isTripped(DAY_1)).toBe(true);
  });

  it("resets accumulated spend at the UTC day boundary", async () => {
    const breaker = createSpendBreaker(500);
    await breaker.record(500, DAY_1);
    expect(await breaker.isTripped(DAY_1)).toBe(true);
    // new day rolls the counter over
    expect(await breaker.spentTodayCents(DAY_2)).toBe(0);
    expect(await breaker.isTripped(DAY_2)).toBe(false);
  });

  it("never trips when the ceiling is zero or negative (disabled)", async () => {
    const breaker = createSpendBreaker(0);
    await breaker.record(10_000, DAY_1);
    expect(await breaker.isTripped(DAY_1)).toBe(false);
  });

  it("ignores non-positive recorded amounts", async () => {
    const breaker = createSpendBreaker(500);
    await breaker.record(-100, DAY_1);
    await breaker.record(0, DAY_1);
    expect(await breaker.spentTodayCents(DAY_1)).toBe(0);
  });
});
