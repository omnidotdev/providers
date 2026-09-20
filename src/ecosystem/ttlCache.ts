export interface TtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

/**
 * Tiny time-to-live read cache for popular upstream reads (products, creators).
 * Mirrors Blink's `ttlReadCache` so a burst of visitors to one published site
 * does not hammer Halo/Crystal. `now` is injectable for tests.
 */
export const createTtlCache = <T>(
  ttlMs: number,
  now: () => number = Date.now,
): TtlCache<T> => {
  const store = new Map<string, { value: T; expiresAt: number }>();

  return {
    get(key) {
      const entry = store.get(key);

      if (!entry) return undefined;

      if (now() > entry.expiresAt) {
        store.delete(key);

        return undefined;
      }

      return entry.value;
    },
    set(key, value) {
      store.set(key, { value, expiresAt: now() + ttlMs });
    },
  };
};
