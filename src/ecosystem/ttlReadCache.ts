/**
 * Short-TTL in-memory read cache for ecosystem block upstream reads.
 *
 * `TreeNode.supportData` (crystal) and `buyData` (halo) are resolved by hitting
 * an external HTTP endpoint on every public profile query. The grafast loaders
 * dedupe identical keys within a single request, but a popular profile still
 * refetches the same upstream data on every visit, and a profile with many
 * distinct support/buy blocks fans out one upstream call per block per page
 * load. This cache absorbs that: a key read once is served from memory for a
 * short window, so a traffic burst collapses onto a single upstream call while a
 * creator's funding-goal or product edit still shows within seconds.
 *
 * Both successful and null (fail-soft) results are cached, the latter under a
 * shorter negative TTL so an upstream outage is not hammered but recovers
 * quickly. This is a single-instance, dependency-light guard (a Map with
 * timestamped entries); it never changes the fail-soft contract, and the cached
 * value carries no auth material, only the public read result.
 */

/** Positive-result TTL: successful upstream reads are served from cache this long. */
export const ECOSYSTEM_READ_TTL_MS = 45_000;

/**
 * Negative-result TTL: null (unconfigured-aside) / fail-soft reads are cached
 * for a shorter window than successes, so a transient upstream outage is not
 * refetched on every visit yet recovers within seconds of coming back
 */
export const ECOSYSTEM_READ_NEGATIVE_TTL_MS = 10_000;

/**
 * Upper bound on distinct cached keys. A bounded map keeps a pathological spread
 * of one-off keys (many distinct slugs/product ids) from growing memory without
 * limit; when exceeded, expired entries are dropped first, then the oldest
 */
const ECOSYSTEM_READ_MAX_ENTRIES = 5_000;

/** A cached read result and the instant it stops being served. */
interface CacheEntry<T> {
  value: T | null;
  expiresAt: number;
}

/** A per-key short-TTL read cache over an async loader. */
export interface TtlReadCache<T> {
  /**
   * Return the cached value for `key` when a live entry exists, otherwise run
   * `load`, cache its result (positive or negative TTL by whether it is null),
   * and return it. Expired entries are evicted lazily on read
   */
  read: (key: string, load: () => Promise<T | null>) => Promise<T | null>;
  /** Drop every cached entry */
  clear: () => void;
}

/**
 * Create a short-TTL in-memory read cache. Successful results live for `ttlMs`,
 * null results for the shorter `negativeTtlMs`, and the map is capped at
 * `maxEntries`. `now` is injectable so expiry is deterministic under test
 *
 * @param options.ttlMs - Positive-result lifetime in ms
 * @param options.negativeTtlMs - Null-result lifetime in ms
 * @param options.maxEntries - Max distinct keys retained
 * @param options.now - Clock source (defaults to `Date.now`)
 */
export const createTtlReadCache = <T>({
  ttlMs = ECOSYSTEM_READ_TTL_MS,
  negativeTtlMs = ECOSYSTEM_READ_NEGATIVE_TTL_MS,
  maxEntries = ECOSYSTEM_READ_MAX_ENTRIES,
  now = Date.now,
}: {
  ttlMs?: number;
  negativeTtlMs?: number;
  maxEntries?: number;
  now?: () => number;
} = {}): TtlReadCache<T> => {
  const store = new Map<string, CacheEntry<T>>();

  /**
   * Enforce the size cap: drop expired entries first, then the oldest by
   * insertion order (Map preserves it) until back under the limit
   */
  const evict = (nowMs: number): void => {
    if (store.size <= maxEntries) return;

    for (const [key, entry] of store) {
      if (entry.expiresAt <= nowMs) store.delete(key);
    }

    while (store.size > maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest === undefined) break;
      store.delete(oldest);
    }
  };

  return {
    read: async (key, load) => {
      const nowMs = now();

      const hit = store.get(key);
      if (hit) {
        if (hit.expiresAt > nowMs) return hit.value;
        // Lazily evict the stale entry before refetching
        store.delete(key);
      }

      const value = await load();
      const ttl = value === null ? negativeTtlMs : ttlMs;
      store.set(key, { value, expiresAt: now() + ttl });
      evict(now());

      return value;
    },
    clear: () => store.clear(),
  };
};
