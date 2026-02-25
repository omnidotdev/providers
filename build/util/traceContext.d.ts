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
declare const generateTraceparent: () => string;
/**
 * Get trace context headers for outgoing HTTP requests.
 *
 * If OpenTelemetry is active in the process, attempts to
 * extract the current span context. Otherwise generates a
 * fresh traceparent.
 */
declare const getTraceHeaders: () => {
    traceparent: string;
};
export { generateTraceparent, getTraceHeaders };
