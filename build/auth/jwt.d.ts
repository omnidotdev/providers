import type { UserInfoClaims } from "./types";
type VerifyAccessTokenConfig = {
    /** Base URL of the auth service (for JWKS endpoint) */
    authBaseUrl: string;
    /** Expected issuer claim (defaults to authBaseUrl) */
    issuer?: string;
};
type VerifySelfHostedTokenConfig = {
    /** Primary secret for JWT verification */
    secret: string;
    /** Previous secret for key rotation support */
    previousSecret?: string;
    /** Expected issuer claim (defaults to "self-hosted") */
    issuer?: string;
    /** Salt for HKDF key derivation */
    salt?: string;
};
/**
 * Verify a JWT access token using JWKS (SaaS mode).
 * Fetches the signing key from the auth service's JWKS endpoint.
 * @param token - Raw JWT string
 * @param config - JWKS verification config
 * @returns Verified JWT claims including organization membership
 * @throws When token is invalid or JWKS endpoint is unreachable
 */
declare function verifyAccessToken(token: string, config: VerifyAccessTokenConfig): Promise<UserInfoClaims>;
/**
 * Verify a self-hosted JWT signed with a symmetric secret.
 * Supports key rotation by trying current secret first, then previous.
 * @param token - Raw JWT string
 * @param config - Symmetric key verification config
 * @returns Verified JWT claims including organization membership
 * @throws When token is invalid or secrets are not configured
 */
declare function verifySelfHostedToken(token: string, config: VerifySelfHostedTokenConfig): Promise<UserInfoClaims>;
export { verifyAccessToken, verifySelfHostedToken };
export type { VerifyAccessTokenConfig, VerifySelfHostedTokenConfig };
