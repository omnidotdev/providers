type TtlCacheConfig = {
    /** Default TTL in milliseconds */
    defaultTtlMs?: number;
};
/**
 * Generic TTL-based in-memory cache.
 * Supports optional version-aware invalidation.
 */
declare class TtlCache<T = unknown> {
    private cache;
    private readonly defaultTtlMs;
    constructor(config?: TtlCacheConfig);
    /**
     * Get a cached value if it exists and hasn't expired.
     * Optionally validate against a version number.
     */
    get(key: string, version?: number): T | null;
    /** Set a cached value with TTL and optional version */
    set(key: string, value: T, ttlMs?: number, version?: number): void;
    /** Check if a key exists and hasn't expired */
    has(key: string): boolean;
    /** Delete a specific cache entry */
    delete(key: string): void;
    /** Invalidate entries matching a pattern (substring match) */
    invalidate(pattern: string): void;
    /** Invalidate entries matching a prefix */
    invalidateByPrefix(prefix: string): void;
    /** Clear all entries */
    clear(): void;
    /** Get the number of entries (including potentially expired) */
    get size(): number;
}
export { TtlCache };
export type { TtlCacheConfig };
