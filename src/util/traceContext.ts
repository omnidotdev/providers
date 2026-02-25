/**
 * Generate a random hex string of the specified byte length.
 */
const randomHex = (bytes: number): string => {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Generate a W3C traceparent header value.
 *
 * Format: `{version}-{trace-id}-{parent-id}-{trace-flags}`
 * - version: `00`
 * - trace-id: 16 random bytes (32 hex chars)
 * - parent-id: 8 random bytes (16 hex chars)
 * - trace-flags: `01` (sampled)
 *
 * @see https://www.w3.org/TR/trace-context/
 */
const generateTraceparent = (): string => {
  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return `00-${traceId}-${spanId}-01`;
};

/**
 * Get trace context headers for outgoing HTTP requests.
 *
 * If OpenTelemetry is active in the process, attempts to
 * extract the current span context. Otherwise generates a
 * fresh traceparent.
 */
const getTraceHeaders = (): { traceparent: string } => {
  // Try OpenTelemetry context if available (optional peer dep)
  try {
    const otel = globalThis as Record<string, unknown>;
    const api = otel.__OTEL_API__ as
      | {
          trace?: {
            getActiveSpan?: () => unknown;
          };
        }
      | undefined;
    const span = api?.trace?.getActiveSpan?.() as
      | {
          spanContext?: () => {
            traceId: string;
            spanId: string;
            traceFlags: number;
          };
        }
      | undefined;

    if (span?.spanContext) {
      const ctx = span.spanContext();
      if (ctx.traceId && ctx.spanId) {
        const flags = ctx.traceFlags.toString(16).padStart(2, "0");
        return {
          traceparent: `00-${ctx.traceId}-${ctx.spanId}-${flags}`,
        };
      }
    }
  } catch {
    // No OTel -- fall through to generate
  }

  return { traceparent: generateTraceparent() };
};

export { generateTraceparent, getTraceHeaders };
