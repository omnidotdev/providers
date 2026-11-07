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

/** Default flush interval in milliseconds */
const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

/**
 * Default number of queued events that forces a flush. Kept well under the
 * collector's hard cap of 100 events per batch.
 */
const DEFAULT_MAX_BATCH_SIZE = 20;

/** Key under which the per-tab session id is cached in `sessionStorage` */
const SESSION_STORAGE_KEY = "prism.sid";

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

/** A no-op client that neither queues nor sends anything */
const noopClient: PrismClient = {
  track: () => {},
  flush: () => {},
};

/** Generate a session id, preferring the Web Crypto UUID when available */
const generateSessionId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Resolve the per-tab session id, reusing the one cached in `sessionStorage`
 * so it survives reloads within the same tab. Falls back to an in-memory id
 * when storage is unavailable (private mode, blocked site data)
 */
const resolveSessionId = (): string => {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;

    const sessionId = generateSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);

    return sessionId;
  } catch {
    return generateSessionId();
  }
};

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
const createPrismClient = (config: PrismClientConfig): PrismClient => {
  const {
    collectorUrl,
    product,
    flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
    maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
    fetch: fetchImpl,
  } = config;

  // Graceful no-op when the collector is unconfigured, or when running outside
  // a browser (SSR). Both paths avoid any network call and never throw.
  if (!collectorUrl || typeof window === "undefined") return noopClient;

  const endpoint = `${collectorUrl.replace(/\/+$/, "")}/collect`;
  const sessionId = resolveSessionId();
  const queue: PrismEvent[] = [];

  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stopTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  /**
   * Drain and send the queued batch. Uses `navigator.sendBeacon` on page
   * teardown (it survives the unload that cancels an in-flight fetch) and a
   * keepalive fetch otherwise. The timer is stopped once the queue empties and
   * restarted on the next `track`, so no interval lingers after a flush.
   */
  const send = (useBeacon: boolean) => {
    if (queue.length === 0) {
      stopTimer();

      return;
    }

    const events = queue.splice(0, queue.length);
    const body = JSON.stringify({ product, events });

    stopTimer();

    // sendBeacon posts text/plain (a browser cannot set a JSON content-type on
    // a beacon); the collector parses text/plain bodies for exactly this case.
    if (
      useBeacon &&
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      try {
        navigator.sendBeacon(endpoint, body);

        return;
      } catch {
        // fall through to fetch
      }
    }

    const doFetch = fetchImpl ?? globalThis.fetch;

    // Analytics must never surface an error into the host app, so swallow
    // rejections. keepalive lets the request outlive a navigation.
    void doFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  };

  const ensureTimer = () => {
    if (intervalId === null) {
      intervalId = setInterval(() => send(false), flushIntervalMs);
    }
  };

  const track = (name: string, properties?: Record<string, unknown>) => {
    const event: PrismEvent = { name, sessionId };

    const path = window.location?.pathname;
    if (path) event.path = path;

    const referrer = document.referrer;
    if (referrer) event.referrer = referrer;

    if (properties) event.properties = properties;

    queue.push(event);
    ensureTimer();

    if (queue.length >= maxBatchSize) send(false);
  };

  const flush = () => send(false);

  // Flush on page teardown so a batch queued right before the user leaves is
  // not lost. `pagehide` covers unload/bfcache; `visibilitychange=hidden`
  // covers tab backgrounding, which on mobile is often the last event fired.
  window.addEventListener("pagehide", () => send(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send(true);
  });

  return { track, flush };
};

export type { PrismClient, PrismClientConfig, PrismEvent };
export { createPrismClient };
