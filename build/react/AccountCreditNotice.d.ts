import type { AccountCredit } from "../billing/interface";
export interface AccountCreditNoticeProps {
    /** From `BillingProvider.getAccountCredit`; null or undefined shows none */
    accountCredit: AccountCredit | null | undefined;
    /** The workspace's invoices on the account hub (`hubInvoicesUrl`) */
    invoicesUrl?: string;
    /** Display locale; the runtime default when omitted */
    locale?: string;
    /** App-specific styling for the wrapper */
    className?: string;
    /** App-specific styling for the Invoices link */
    linkClassName?: string;
}
/**
 * Compact account-credit line for a product's billing page: "Account credit:
 * $10.00, applied to your next invoice", or the amount owed, plus an Invoices
 * link to the account hub. Account credit is the workspace's Stripe customer
 * balance, a different balance from prepaid Omni credits, so it always says
 * "Account credit". Headless (no styles of its own) and dependency-free;
 * renders nothing when there is neither a balance nor an invoices link
 */
export declare const AccountCreditNotice: ({ accountCredit, invoicesUrl, locale, className, linkClassName, }: AccountCreditNoticeProps) => import("react/jsx-runtime").JSX.Element | null;
