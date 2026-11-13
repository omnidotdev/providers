import { describe, expect, it } from "bun:test";

import {
  CREDITS_PER_USD,
  creditsFromBalanceUsd,
  creditsFromChargeUsd,
  formatCredits,
  usdFromCredits,
} from "./creditDisplay";
import { CENTS_PER_CREDIT, creditsFromCostCents } from "./helpers";

describe("credit unit", () => {
  it("defines one credit as one retail US cent", () => {
    expect(CENTS_PER_CREDIT).toBe(1);
    expect(CREDITS_PER_USD).toBe(100);
  });

  it("agrees with creditsFromCostCents at a 1.0 markup", () => {
    // $0.29 retail is 29 cents, whichever helper converts it
    expect(creditsFromCostCents(29, 1)).toBe(29);
    expect(creditsFromChargeUsd("0.2900")).toBe(29);
    expect(creditsFromBalanceUsd("0.2900")).toBe(29);
  });
});

describe("creditsFromBalanceUsd", () => {
  it("converts the numeric(12,4) string form exactly", () => {
    expect(creditsFromBalanceUsd("1.0000")).toBe(100);
    expect(creditsFromBalanceUsd("0.0150")).toBe(1);
    expect(creditsFromBalanceUsd("12.3400")).toBe(1234);
    expect(creditsFromBalanceUsd("0.0000")).toBe(0);
    expect(creditsFromBalanceUsd("99999999.9999")).toBe(9_999_999_999);
  });

  it("converts numbers without float drift", () => {
    // 0.29 * 100 is 28.999999999999996 in IEEE 754
    expect(creditsFromBalanceUsd(0.29)).toBe(29);
    expect(creditsFromBalanceUsd(0.57)).toBe(57);
    expect(creditsFromBalanceUsd(1.1)).toBe(110);
    expect(creditsFromBalanceUsd(1)).toBe(100);
    expect(creditsFromBalanceUsd(0)).toBe(0);
  });

  it("rounds down so a balance never overstates spendable credits", () => {
    expect(creditsFromBalanceUsd("0.0199")).toBe(1);
    expect(creditsFromBalanceUsd("0.0099")).toBe(0);
    expect(creditsFromBalanceUsd(0.009)).toBe(0);
    expect(creditsFromBalanceUsd(1e-7)).toBe(0);
  });

  it("rounds an overdrawn balance toward more debt, not less", () => {
    expect(creditsFromBalanceUsd("-1.0000")).toBe(-100);
    expect(creditsFromBalanceUsd("-0.0150")).toBe(-2);
    expect(creditsFromBalanceUsd(-0.29)).toBe(-29);
  });

  it("never returns negative zero", () => {
    expect(Object.is(creditsFromBalanceUsd("-0.0000"), 0)).toBe(true);
    expect(Object.is(creditsFromBalanceUsd(-0), 0)).toBe(true);
  });

  it("rejects malformed input", () => {
    for (const bad of ["", " 1.00", "1.", ".5", "1e3", "+1", "abc", "1,00"]) {
      expect(() => creditsFromBalanceUsd(bad)).toThrow(TypeError);
    }
    expect(() => creditsFromBalanceUsd(Number.NaN)).toThrow(TypeError);
    expect(() => creditsFromBalanceUsd(Number.POSITIVE_INFINITY)).toThrow(
      TypeError,
    );
  });

  it("rejects a balance beyond safe-integer credits", () => {
    expect(() => creditsFromBalanceUsd("1000000000000000000")).toThrow(
      RangeError,
    );
    expect(() => creditsFromBalanceUsd(1e21)).toThrow(RangeError);
  });
});

describe("creditsFromChargeUsd", () => {
  it("rounds up so a charge never understates its cost", () => {
    expect(creditsFromChargeUsd("0.0150")).toBe(2);
    expect(creditsFromChargeUsd("0.0001")).toBe(1);
    expect(creditsFromChargeUsd(0.0001)).toBe(1);
    expect(creditsFromChargeUsd(1e-7)).toBe(1);
  });

  it("is exact on whole credits", () => {
    expect(creditsFromChargeUsd("1.0000")).toBe(100);
    expect(creditsFromChargeUsd(0.29)).toBe(29);
    expect(creditsFromChargeUsd(0)).toBe(0);
  });

  it("rejects malformed input", () => {
    expect(() => creditsFromChargeUsd("free")).toThrow(TypeError);
    expect(() => creditsFromChargeUsd(Number.NaN)).toThrow(TypeError);
  });
});

describe("usdFromCredits", () => {
  it("inverts the credit unit", () => {
    expect(usdFromCredits(100)).toBe(1);
    expect(usdFromCredits(29)).toBe(0.29);
    expect(usdFromCredits(1)).toBe(0.01);
    expect(usdFromCredits(-150)).toBe(-1.5);
    expect(usdFromCredits(0)).toBe(0);
  });

  it("round-trips whole credits through the balance conversion", () => {
    for (const credits of [0, 1, 7, 29, 57, 100, 1234, 9_999_999_999]) {
      expect(creditsFromBalanceUsd(usdFromCredits(credits))).toBe(credits);
    }
  });

  it("rejects fractional or non-finite credits", () => {
    expect(() => usdFromCredits(1.5)).toThrow(TypeError);
    expect(() => usdFromCredits(Number.NaN)).toThrow(TypeError);
    expect(() => usdFromCredits(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe("formatCredits", () => {
  it("groups digits for the locale", () => {
    expect(formatCredits(1234567, "en-US")).toBe("1,234,567");
    expect(formatCredits(1234567, "de-DE")).toBe("1.234.567");
    expect(formatCredits(0, "en-US")).toBe("0");
    expect(formatCredits(-50, "en-US")).toBe("-50");
  });

  it("floors a fractional value instead of rounding it up", () => {
    expect(formatCredits(99.9, "en-US")).toBe("99");
    expect(formatCredits(-0.5, "en-US")).toBe("-1");
  });

  it("rejects non-finite input", () => {
    expect(() => formatCredits(Number.NaN)).toThrow(TypeError);
  });
});
