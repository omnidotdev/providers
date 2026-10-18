/**
 * Shared invoicing contract and money math for the Omni ecosystem.
 *
 * This is the single source of truth for the cross-product invoicing CloudEvents
 * payload shapes (producer: Mantle; consumer: MyFi) and the pure money/credit
 * math, so the two sides cannot drift. It owns SHAPE and LOGIC only, never
 * storage: each product keeps its own tables and migrations.
 *
 * Pure and dependency-free, so it is safe in both server and browser consumers.
 */

/**
 * Kinds of credit-ledger movement (mirrors `credit_transaction.kind`). Positive
 * entries (`overpayment`, `creditNote`, `adjustment`) add to a workspace's
 * balance; `application` entries are negative (drawn onto an invoice); `void`
 * reverses a prior entry.
 */
export const CREDIT_TRANSACTION_KINDS = [
  "overpayment",
  "creditNote",
  "application",
  "adjustment",
  "void",
] as const;

export type CreditTransactionKind = (typeof CREDIT_TRANSACTION_KINDS)[number];

/**
 * The stable `<entity>.<action>` suffixes of the invoicing CloudEvents contract.
 * The on-the-wire `type` is `<product>.<suffix>` (e.g. `mantle.payment.created`);
 * the product prefix is provenance, the suffix is the shared contract, so a
 * consumer keys on the suffix and `source`.
 */
export const PAYMENT_EVENT_SUFFIXES = [
  "payment.created",
  "payment.updated",
  "payment.deleted",
] as const;

export const CREDIT_EVENT_SUFFIXES = [
  "credit.issued",
  "credit.applied",
  "credit.voided",
] as const;

/** Build a product-prefixed invoicing event type, e.g. `mantle.payment.created`. */
export const invoicingEventType = (product: string, suffix: string): string =>
  `${product}.${suffix}`;

/** CloudEvents `data` shape for `payment.*` events. `amount` is a numeric string. */
export interface PaymentEventData {
  id: string;
  invoiceId: string | null;
  /** Resolved from the parent invoice so a consumer can find the workspace */
  organizationId?: string;
  currency?: string;
  amount: string;
  paidAt?: string | null;
  reference?: string | null;
  method?: string | null;
}

/** CloudEvents `data` shape for `credit.*` events. `amount` is the signed ledger value. */
export interface CreditEventData {
  id: string;
  organizationId: string;
  currency: string;
  invoiceId: string | null;
  paymentId?: string | null;
  amount: string;
  kind: CreditTransactionKind;
}

/**
 * Parse a money string (numeric(_, 2)) to integer cents, or null when not a
 * finite number. Working in cents keeps comparisons exact instead of leaning on
 * binary floating point.
 */
export const toCents = (
  value: string | number | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
};

/** Format integer cents back to a 2-decimal money string. */
export const fromCents = (cents: number): string => (cents / 100).toFixed(2);

/**
 * An invoice's outstanding balance in cents: total, less payments, less credit
 * already applied to it. `appliedCreditCents` is the POSITIVE magnitude applied
 * (not the negative ledger value).
 */
export const outstandingCents = (
  totalCents: number,
  paidCents: number,
  appliedCreditCents = 0,
): number => totalCents - paidCents - appliedCreditCents;

/** Whether payments plus applied credit cover the total (needs a positive total). */
export const isSettled = (
  totalCents: number,
  paidCents: number,
  appliedCreditCents = 0,
): boolean => totalCents > 0 && paidCents + appliedCreditCents >= totalCents;
