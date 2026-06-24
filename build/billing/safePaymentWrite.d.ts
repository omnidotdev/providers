/**
 * CloudEvent type emitted when a payment-provider WRITE fails. Route this to an
 * alerting sink (e.g. Vortex -> Discord) so a money-moving call that silently
 * fails (a missing key scope, a provider outage) cannot pass unnoticed.
 */
declare const BILLING_WRITE_FAILED_EVENT = "billing.write.failed";
/**
 * Minimal structural events provider: anything with an `emit` that takes a
 * CloudEvent-ish payload. Keeps this helper decoupled from the full
 * EventsProvider so any caller can pass their configured provider.
 */
type AlertEventsProvider = {
    emit: (event: {
        type: string;
        data: Record<string, unknown>;
        subject?: string;
        organizationId?: string;
    }) => Promise<unknown>;
};
type SafePaymentWriteOptions = {
    /**
     * Provider-side dedup key (REQUIRED). A payment WRITE must be idempotent so a
     * retried/duplicated call cannot double-charge. Passing an empty key is a bug
     * and throws before `fn` runs.
     */
    idempotencyKey: string;
    /** Short label for the operation, used in logs and the alert payload. */
    operation: string;
    /** When provided, a failure emits a `billing.write.failed` alert event. */
    events?: AlertEventsProvider;
    /** Extra context attached to logs and the alert payload (no secrets/PII). */
    context?: Record<string, unknown>;
    /** Invoked on failure, AFTER the alert, BEFORE the rethrow. */
    onError?: (err: unknown) => void | Promise<void>;
};
/**
 * Run a payment-provider WRITE (charge, refund, invoice item, payout) with the
 * three guarantees every money-moving call needs and that diverged across
 * repos:
 *  1. mandatory idempotency key (dedup retries -> never double-charge)
 *  2. alert-on-failure (emit `billing.write.failed`, routable to Discord)
 *  3. rethrow (NEVER swallow a write error: the caller must surface non-2xx so
 *     the provider retries, and must not flip local ledger state on a failure)
 *
 * The alert emit is best-effort: if it throws, that failure is swallowed so it
 * can never mask the original write error, which is always rethrown.
 *
 * @example
 * await safePaymentWrite(
 *   () => stripe.invoiceItems.create(params, { idempotencyKey: key }),
 *   { idempotencyKey: key, operation: "overage-charge", events },
 * );
 */
declare function safePaymentWrite<T>(fn: () => Promise<T>, opts: SafePaymentWriteOptions): Promise<T>;
/**
 * True when an error is a provider PERMISSION/scope denial (e.g. a restricted
 * Stripe key missing a write scope) rather than a validation or transient
 * error. Used to flag the actionable "fix the key" case in alerts and to power
 * boot-time scope probes. Deliberately NOT true for validation (400) errors.
 */
declare function isPermissionError(err: unknown): boolean;
type ScopeProbeResult = {
    ok: true;
} | {
    ok: false;
    permission: true;
} | {
    ok: false;
    permission: false;
    error: string;
};
/**
 * Boot-time key-scope check: run a deliberately-invalid no-op write `probe` and
 * classify the outcome WITHOUT moving money. A permission error means the
 * deployed key lacks the write scope (the actionable misconfiguration); a
 * validation error means the call was authorized and only failed on params, so
 * the scope IS present. Never throws -- a probe must not crash boot.
 */
declare function probeWriteScope(probe: () => Promise<unknown>, opts?: {
    operation?: string;
}): Promise<ScopeProbeResult>;
export { BILLING_WRITE_FAILED_EVENT, isPermissionError, probeWriteScope, safePaymentWrite, };
export type { AlertEventsProvider, SafePaymentWriteOptions, ScopeProbeResult };
