export interface TtlCache<T> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
}
/**
 * Tiny time-to-live read cache for popular upstream reads (products, creators).
 * Mirrors Blink's `ttlReadCache` so a burst of visitors to one published site
 * does not hammer Halo/Crystal. `now` is injectable for tests.
 */
export declare const createTtlCache: <T>(ttlMs: number, now?: () => number) => TtlCache<T>;
