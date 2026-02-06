type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  version?: number;
};

type TtlCacheConfig = {
  /** Default TTL in milliseconds */
  defaultTtlMs?: number;
};

const DEFAULT_TTL_MS = 300_000; // 5 minutes

/**
 * Generic TTL-based in-memory cache.
 * Supports optional version-aware invalidation.
 */
class TtlCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlMs: number;

  constructor(config?: TtlCacheConfig) {
    this.defaultTtlMs = config?.defaultTtlMs ?? DEFAULT_TTL_MS;
  }

  /**
   * Get a cached value if it exists and hasn't expired.
   * Optionally validate against a version number.
   */
  get(key: string, version?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    if (version !== undefined && entry.version !== version) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /** Set a cached value with TTL and optional version */
  set(key: string, value: T, ttlMs?: number, version?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      version,
    });
  }

  /** Check if a key exists and hasn't expired */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /** Delete a specific cache entry */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /** Invalidate entries matching a pattern (substring match) */
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /** Invalidate entries matching a prefix */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /** Clear all entries */
  clear(): void {
    this.cache.clear();
  }

  /** Get the number of entries (including potentially expired) */
  get size(): number {
    return this.cache.size;
  }
}

export { TtlCache };

export type { TtlCacheConfig };
