import { describe, expect, it } from "bun:test";

import { accountCreditDisplay, formatMinorAmount } from "./accountCredit";

describe("accountCreditDisplay", () => {
  it("shows credit toward the next invoice", () => {
    expect(
      accountCreditDisplay(
        { balance: -1000, credit: 1000, due: 0, currency: "usd" },
        "en-US",
      ),
    ).toEqual({
      kind: "credit",
      amount: 1000,
      currency: "usd",
      label: "$10.00",
    });
  });

  it("shows an amount owed, never as credit", () => {
    expect(
      accountCreditDisplay(
        { balance: 250, credit: 0, due: 250, currency: "usd" },
        "en-US",
      ),
    ).toEqual({ kind: "due", amount: 250, currency: "usd", label: "$2.50" });
  });

  it("shows nothing at zero, when unknown, or for malformed input", () => {
    expect(
      accountCreditDisplay({ balance: 0, credit: 0, due: 0, currency: "usd" }),
    ).toEqual({ kind: "none" });
    expect(accountCreditDisplay(null)).toEqual({ kind: "none" });
    expect(accountCreditDisplay(undefined)).toEqual({ kind: "none" });
    expect(
      accountCreditDisplay({
        balance: 0,
        credit: Number.NaN,
        due: -5,
        currency: "usd",
      }),
    ).toEqual({ kind: "none" });
    expect(
      accountCreditDisplay({
        balance: -100,
        credit: 100,
        due: 0,
        currency: "not-a-currency",
      }),
    ).toEqual({ kind: "none" });
  });
});

describe("formatMinorAmount", () => {
  it("formats cents as dollars", () => {
    expect(formatMinorAmount(123456, "usd", "en-US")).toBe("$1,234.56");
  });

  it("respects zero-decimal currencies", () => {
    expect(formatMinorAmount(500, "jpy", "en-US")).toBe("¥500");
  });
});
