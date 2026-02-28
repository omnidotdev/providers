import type { UserInfoClaims } from "./types";
type VerifyAccessTokenConfig = {
    /** Base URL of the auth service (for JWKS endpoint) */
    authBaseUrl: string;
    /** Expected issuer claim (defaults to authBaseUrl) */
    issuer?: string;
};
/**
 * Verify a JWT access token using JWKS.
 * Fetches the signing key from the auth service's JWKS endpoint.
 * @deprecated Use `createOidcClient` from `./oidc` instead, which adds
 * OIDC discovery, configurable JWKS caching, and `verifyIdToken`
 * @param token - Raw JWT string
 * @param config - JWKS verification config
 * @returns Verified JWT claims including organization membership
 * @throws When token is invalid or JWKS endpoint is unreachable
 */
declare function verifyAccessToken(token: string, config: VerifyAccessTokenConfig): Promise<UserInfoClaims>;
export { verifyAccessToken };
export type { VerifyAccessTokenConfig };
