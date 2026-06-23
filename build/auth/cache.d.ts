/**
 * Cached auth data stored in an encrypted cookie.
 *
 * Deliberately holds ONLY bounded identity fields. Organization membership is
 * unbounded (it grows with every org a user joins) and must never live in a
 * cookie: it is re-derived from the verified ID token on each request in
 * `createGetAuth`. Persisting it here previously bloated request headers past
 * the server's limit, hard-failing login for users in many orgs (HTTP 431).
 */
type CachedAuthData = {
    /**
     * Consuming app's user-row UUID. Populated by `createGetAuth`'s
     * `resolveRowId` callback on cache miss; absent if no resolver was
     * configured or the resolver returned null.
     */
    rowId?: string;
    identityProviderId: string;
};
type AuthCacheConfig = {
    /** App name used to derive cookie name and HKDF salt */
    appName: string;
};
type AuthCache = {
    /** Encrypt auth data for cookie storage */
    encrypt: (data: CachedAuthData) => Promise<string>;
    /** Decrypt an encrypted cookie value */
    decrypt: (encrypted: string) => Promise<CachedAuthData | null>;
    /** Cookie name: `${appName}_rowid_cache` */
    cookieName: string;
    /** Cookie TTL in seconds (7 days) */
    cookieTtlSeconds: number;
};
/**
 * Create an encrypted auth cookie cache.
 * Uses HKDF key derivation from `AUTH_SECRET` with `AUTH_SECRET_PREVIOUS`
 * rotation support.
 * @param config - Cache configuration
 * @returns Auth cache with encrypt, decrypt, cookieName, cookieTtlSeconds
 */
declare function createAuthCache(config: AuthCacheConfig): AuthCache;
export { createAuthCache };
export type { AuthCache, AuthCacheConfig, CachedAuthData };
