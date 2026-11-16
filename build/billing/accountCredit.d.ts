import type { AccountCredit } from "./interface";
/**
 * Account credit display helpers. Account credit is the balance on a
 * workspace's Stripe customer that Stripe applies to its next invoice (from
 * `BillingProvider.getAccountCredit`), in the currency's minor unit. It is a
 * different balance from prepaid Omni credits (see `creditDisplay`), so it is
 * always labeled "Account credit", never "credits"
 */
/** What a billing page shows for a workspace's account credit */
export type AccountCreditDisplay = 
/** Nothing to show: no credit and nothing owed (or unknown) */
{
    kind: "none";
} | {
    /** `credit` reduces the next invoice; `due` is added to it */
    kind: "credit" | "due";
    /** Amount in the currency's minor unit, always positive */
    amount: number;
    currency: string;
    /** Formatted amount, e.g. "$10.00" */
    label: string;
};
/**
 * Format an amount in a currency's minor unit (cents for USD, whole yen for
 * JPY) as money
 * @param amount - Amount in the minor unit
 * @param currency - ISO currency code, any case
 * @param locale - Display locale; the runtime default when omitted
 */
export declare const formatMinorAmount: (amount: number, currency: string, locale?: string) => string;
/**
 * How to show a workspace's account credit: credit toward the next invoice,
 * an amount owed added to it, or nothing (null, zero, or malformed input).
 * Reads the provider's pre-split `credit` and `due`, so the Stripe sign
 * convention (negative balance is credit) is never re-derived by a product
 * @param accountCredit - From `BillingProvider.getAccountCredit`
 * @param locale - Display locale; the runtime default when omitted
 */
export declare const accountCreditDisplay: (accountCredit: AccountCredit | null | undefined, locale?: string) => AccountCreditDisplay;
