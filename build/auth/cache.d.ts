import type { OrganizationClaim } from "./types";
/** Cached auth data stored in an encrypted cookie */
type CachedAuthData = {
    rowId: string;
    identityProviderId: string;
    organizations: OrganizationClaim[];
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
