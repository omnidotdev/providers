import { log } from "../util/log";

/**
 * CloudEvent type emitted when a payment-provider WRITE fails. Route this to an
 * alerting sink (e.g. Vortex -> Discord) so a money-moving call that silently
 * fails (a missing key scope, a provider outage) cannot pass unnoticed.
 */
const BILLING_WRITE_FAILED_EVENT = "billing.write.failed";

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
async function safePaymentWrite<T>(
  fn: () => Promise<T>,
  opts: SafePaymentWriteOptions,
): Promise<T> {
  if (!opts.idempotencyKey) {
    throw new Error(
      `safePaymentWrite(${opts.operation}) requires a non-empty idempotencyKey`,
    );
  }

  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "billing", "payment write failed", {
      operation: opts.operation,
      idempotencyKey: opts.idempotencyKey,
      error: message,
      permission: isPermissionError(err),
      ...opts.context,
    });

    if (opts.events) {
      // Best-effort: never let the alert path mask the real write error.
      await opts.events
        .emit({
          type: BILLING_WRITE_FAILED_EVENT,
          data: {
            operation: opts.operation,
            error: message,
            permission: isPermissionError(err),
            ...opts.context,
          },
        })
        .catch((emitErr) =>
          log("error", "billing", "failed to emit billing.write.failed alert", {
            operation: opts.operation,
            error: emitErr instanceof Error ? emitErr.message : String(emitErr),
          }),
        );
    }

    if (opts.onError) {
      await opts.onError(err);
    }

    throw err;
  }
}

/**
 * True when an error is a provider PERMISSION/scope denial (e.g. a restricted
 * Stripe key missing a write scope) rather than a validation or transient
 * error. Used to flag the actionable "fix the key" case in alerts and to power
 * boot-time scope probes. Deliberately NOT true for validation (400) errors.
 */
function isPermissionError(err: unknown): boolean {
  const e = err as {
    type?: string;
    name?: string;
    statusCode?: number;
    status?: number;
    httpStatusCode?: number;
  };
  if (e?.type === "StripePermissionError") return true;
  if (typeof e?.name === "string" && e.name.includes("PermissionError")) {
    return true;
  }
  return (
    e?.statusCode === 403 || e?.status === 403 || e?.httpStatusCode === 403
  );
}

type ScopeProbeResult =
  | { ok: true }
  | { ok: false; permission: true }
  | { ok: false; permission: false; error: string };

/**
 * Boot-time key-scope check: run a deliberately-invalid no-op write `probe` and
 * classify the outcome WITHOUT moving money. A permission error means the
 * deployed key lacks the write scope (the actionable misconfiguration); a
 * validation error means the call was authorized and only failed on params, so
 * the scope IS present. Never throws -- a probe must not crash boot.
 */
async function probeWriteScope(
  probe: () => Promise<unknown>,
  opts?: { operation?: string },
): Promise<ScopeProbeResult> {
  try {
    await probe();
    // A success is unexpected for a no-op probe but proves the scope is present.
    return { ok: true };
  } catch (err) {
    if (isPermissionError(err)) {
      log("error", "billing", "key-scope probe: write scope MISSING", {
        operation: opts?.operation,
      });
      return { ok: false, permission: true };
    }
    // Any non-permission error (notably a 400 validation) means authorized.
    const message = err instanceof Error ? err.message : String(err);
    const e = err as { statusCode?: number; status?: number };
    if (e?.statusCode === 400 || e?.status === 400) return { ok: true };
    return { ok: false, permission: false, error: message };
  }
}

export {
  BILLING_WRITE_FAILED_EVENT,
  isPermissionError,
  probeWriteScope,
  safePaymentWrite,
};
export type { AlertEventsProvider, SafePaymentWriteOptions, ScopeProbeResult };
