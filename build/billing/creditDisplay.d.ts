/** Credits per retail US dollar (100 at 1 cent per credit). */
declare const CREDITS_PER_USD: number;
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
declare const creditsFromBalanceUsd: (balanceUsd: string | number) => number;
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
declare const creditsFromChargeUsd: (chargeUsd: string | number) => number;
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
declare const usdFromCredits: (credits: number) => number;
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
declare const formatCredits: (credits: number, locale?: Intl.LocalesArgument) => string;
export { CREDITS_PER_USD, creditsFromBalanceUsd, creditsFromChargeUsd, formatCredits, usdFromCredits, };
