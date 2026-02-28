import type { JWTVerifyGetKey } from "jose";
import type { UserInfoClaims } from "./types";
/** OIDC Discovery document structure */
type OidcDiscovery = {
    issuer: string;
    jwks_uri: string;
};
type OidcClientConfig = {
    /** Base URL of the auth service (e.g. https://auth.omni.dev) */
    authBaseUrl: string;
};
type OidcClient = {
    /** Verify an ID token JWT using OIDC discovery + JWKS */
    verifyIdToken: (token: string) => Promise<UserInfoClaims>;
    /** Get cached OIDC discovery document (24h TTL) */
    getDiscovery: () => Promise<OidcDiscovery>;
    /** Get cached JWKS key set (1h TTL) */
    getJwks: () => Promise<JWTVerifyGetKey>;
    /** Clear all caches (for tests) */
    clearCache: () => void;
};
/**
 * Create an OIDC Discovery client with JWKS caching.
 * Replaces per-app inline OIDC/JWKS boilerplate.
 * @param config - OIDC client configuration
 * @returns OIDC client with verifyIdToken, getDiscovery, getJwks, clearCache
 */
declare function createOidcClient(config: OidcClientConfig): OidcClient;
export { createOidcClient };
export type { OidcClient, OidcClientConfig, OidcDiscovery };
