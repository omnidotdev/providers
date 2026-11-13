import { CENTS_PER_CREDIT } from "./helpers";

/**
 * Credit display helpers. Aether's credit balance (one shared pool per billing
 * account) is stored in retail USD (`numeric(12,4)`); a credit is a display
 * unit worth {@link CENTS_PER_CREDIT} retail US cent(s). Products display
 * credits derived from the Aether balance with these helpers and never compute
 * a balance from a local ledger.
 *
 * Rounding rules:
 * - Balances round DOWN (toward negative infinity): a displayed balance never
 *   overstates what the user can spend, and an overdrawn balance never
 *   understates the debt
 * - Charges round UP (toward positive infinity): a displayed cost never
 *   understates what an action spends, matching `creditsFromCostCents`
 *
 * Conversions are exact decimal arithmetic (no float multiply), so the
 * `numeric(12,4)` string form and the numbers parsed from it convert without
 * drift (`0.29 * 100` is `28.999999999999996` in floating point).
 *
 * Errors: a malformed or non-finite amount throws a `TypeError`; a result
 * outside the safe-integer range throws a `RangeError`. A display must never
 * silently render garbage input as a plausible balance such as zero.
 */

const CENTS_PER_USD = 100;

/** Credits per retail US dollar (100 at 1 cent per credit). */
const CREDITS_PER_USD = CENTS_PER_USD / CENTS_PER_CREDIT;

/** Plain decimal: optional minus, digits, optional fraction */
const DECIMAL_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;

type Rounding = "floor" | "ceil";

/** Render a USD amount as a plain decimal string, preserving its digits */
const toDecimalText = (amountUsd: string | number): string => {
  if (typeof amountUsd === "string") return amountUsd;

  if (!Number.isFinite(amountUsd)) {
    throw new TypeError(`Invalid USD amount: ${amountUsd}`);
  }

  // The shortest round-trip form is exactly the decimal a numeric(12,4) value
  // was parsed from; only exponent notation needs expanding
  const text = String(amountUsd);
  if (!/e/i.test(text)) return text;

  return Number.isInteger(amountUsd)
    ? BigInt(amountUsd).toString()
    : amountUsd.toFixed(20);
};

/** Convert a retail USD amount to whole credits with exact decimal math */
const usdToCredits = (amountUsd: string | number, rounding: Rounding) => {
  const text = toDecimalText(amountUsd);
  const match = DECIMAL_PATTERN.exec(text);

  if (!match) {
    throw new TypeError(`Invalid USD amount: ${JSON.stringify(text)}`);
  }

  const [, sign, whole, fraction = ""] = match;

  // amount = units / 10^digits, credits = amount * CENTS_PER_USD / CENTS_PER_CREDIT
  const units = BigInt(`${sign}${whole}${fraction}`);
  const numerator = units * BigInt(CENTS_PER_USD);
  const denominator = 10n ** BigInt(fraction.length) * BigInt(CENTS_PER_CREDIT);

  // BigInt division truncates toward zero; adjust inexact results by direction
  let credits = numerator / denominator;
  if (numerator % denominator !== 0n) {
    if (rounding === "floor" && numerator < 0n) credits -= 1n;
    if (rounding === "ceil" && numerator > 0n) credits += 1n;
  }

  if (
    credits > BigInt(Number.MAX_SAFE_INTEGER) ||
    credits < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError(`USD amount out of range for credits: ${text}`);
  }

  // BigInt has no negative zero, so "-0.0000" comes back as 0
  return Number(credits);
};

/**
 * Convert an Aether credit balance (retail USD) into whole display credits,
 * rounded down so the display never overstates what the user can spend. A
 * negative (overdrawn) balance rounds toward more debt.
 *
 * @param balanceUsd - Balance in retail USD, as Aether's `numeric(12,4)` string (e.g. `"1.0000"`) or a number
 * @returns Whole credits (`"1.0000"` is 100, `"0.0150"` is 1, `"-0.0150"` is -2)
 * @throws TypeError when the balance is not a plain finite decimal
 * @throws RangeError when the credits exceed the safe-integer range
 */
const creditsFromBalanceUsd = (balanceUsd: string | number): number =>
  usdToCredits(balanceUsd, "floor");

/**
 * Convert a retail USD charge (a deduction, an estimate, a transaction amount)
 * into whole display credits, rounded up so a cost is never understated and
 * any nonzero charge shows at least one credit, matching `creditsFromCostCents`.
 *
 * Use `creditsFromCostCents` instead for raw provider cost, which still needs
 * the markup applied; this takes an amount that is already retail.
 *
 * @param chargeUsd - Charge in retail USD, as a decimal string or a number
 * @returns Whole credits (`"0.0150"` is 2, `"0.0001"` is 1)
 * @throws TypeError when the charge is not a plain finite decimal
 * @throws RangeError when the credits exceed the safe-integer range
 */
const creditsFromChargeUsd = (chargeUsd: string | number): number =>
  usdToCredits(chargeUsd, "ceil");

/**
 * Convert whole credits into retail USD, the inverse of the credit unit (e.g.
 * a credit allowance or a top-up pack into the dollar amount Aether stores).
 * Exact for whole credits: `creditsFromBalanceUsd(usdFromCredits(n)) === n`.
 *
 * @param credits - Whole credits (a safe integer)
 * @returns Retail USD (29 is 0.29, 100 is 1)
 * @throws TypeError when credits is not an integer
 * @throws RangeError when credits is outside the safe-integer range
 */
const usdFromCredits = (credits: number): number => {
  if (!Number.isInteger(credits)) {
    throw new TypeError(`Credits must be a whole number: ${credits}`);
  }
  if (!Number.isSafeInteger(credits)) {
    throw new RangeError(`Credits out of range: ${credits}`);
  }

  // Adding 0 normalizes a negative zero
  return (credits * CENTS_PER_CREDIT) / CENTS_PER_USD + 0;
};

/**
 * Format credits for display as a locale-grouped whole number (no unit label,
 * so the product owns its own "credits" copy and pluralization). A fractional
 * value is floored, never rounded up.
 *
 * @param credits - Credits, normally from `creditsFromBalanceUsd`
 * @param locale - BCP 47 locale(s); defaults to the runtime locale
 * @returns Formatted credits (`1234567` is `"1,234,567"` in en-US)
 * @throws TypeError when credits is not a finite number
 */
const formatCredits = (
  credits: number,
  locale?: Intl.LocalesArgument,
): string => {
  if (!Number.isFinite(credits)) {
    throw new TypeError(`Invalid credits: ${credits}`);
  }

  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    Math.floor(credits) + 0,
  );
};

export {
  CREDITS_PER_USD,
  creditsFromBalanceUsd,
  creditsFromChargeUsd,
  formatCredits,
  usdFromCredits,
};
