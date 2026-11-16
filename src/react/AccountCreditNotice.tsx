import { accountCreditDisplay } from "../billing/accountCredit";

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
export const AccountCreditNotice = ({
  accountCredit,
  invoicesUrl,
  locale,
  className,
  linkClassName,
}: AccountCreditNoticeProps) => {
  const display = accountCreditDisplay(accountCredit, locale);

  if (display.kind === "none" && !invoicesUrl) return null;

  return (
    <p className={className} data-account-credit={display.kind}>
      {display.kind === "credit" && (
        <span>
          Account credit: <strong>{display.label}</strong>, applied to your next
          invoice.
        </span>
      )}
      {display.kind === "due" && (
        <span>
          Balance due: <strong>{display.label}</strong>, added to your next
          invoice.
        </span>
      )}
      {display.kind !== "none" && invoicesUrl && " "}
      {invoicesUrl && (
        <a href={invoicesUrl} className={linkClassName}>
          Invoices
        </a>
      )}
    </p>
  );
};
