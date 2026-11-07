/**
 * Prism analytics client.
 *
 * A small, dependency-free event-tracking client for Prism (Omni's analytics
 * product). It enqueues events in memory and flushes them in batches to the
 * Prism collector over `POST {collectorUrl}/collect`.
 *
 * Privacy: the client never sends an IP, cookie, or any visitor identifier.
 * Prism's collector derives the visitor id, country, and device server-side
 * from request metadata, so the wire payload carries only the event name, the
 * current path/referrer, a per-tab session id, and optional custom properties.
 *
 * Fleet patterns:
 * - Graceful no-op when `collectorUrl` is falsy, so a product can ship the
 *   client before its collector env is provisioned
 * - SSR-safe: the client is a no-op outside a browser (TanStack Start renders
 *   on the server, where `window`/`navigator`/`document` do not exist)
 */
/**
 * A single analytics event as it travels on the wire. Matches the Prism
 * collector's `/collect` event contract exactly.
 */
interface PrismEvent {
    /** Event name, e.g. "pageview" */
    name: string;
    /** Path the event occurred on, from `window.location.pathname` */
    path?: string;
    /** Document referrer, from `document.referrer` when present */
    referrer?: string;
    /** Per-tab session id, stable across pageviews within one tab */
    sessionId?: string;
    /** Arbitrary custom properties for the event */
    properties?: Record<string, unknown>;
}
interface PrismClientConfig {
    /**
     * Base URL of the Prism collector, with no trailing slash (a trailing slash
     * is tolerated). When falsy, the client is a graceful no-op.
     */
    collectorUrl?: string;
    /** Product identifier the collector attributes events to */
    product: string;
    /** Flush interval in milliseconds (default 10s) */
    flushIntervalMs?: number;
    /** Queue size that triggers an immediate flush (default 20) */
    maxBatchSize?: number;
    /** Fetch implementation, for tests or non-global-fetch runtimes */
    fetch?: typeof globalThis.fetch;
}
interface PrismClient {
    /** Enqueue an event for the next batch flush */
    track: (name: string, properties?: Record<string, unknown>) => void;
    /** Flush the queued batch immediately */
    flush: () => void;
}
/**
 * Create a Prism analytics client.
 *
 * @example
 * const prism = createPrismClient({
 *   collectorUrl: import.meta.env.VITE_PRISM_COLLECTOR_URL,
 *   product: "launchpad",
 * });
 * prism.track("signup", { plan: "pro" });
 */
declare const createPrismClient: (config: PrismClientConfig) => PrismClient;
export type { PrismClient, PrismClientConfig, PrismEvent };
export { createPrismClient };
