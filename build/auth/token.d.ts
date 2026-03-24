/** Minimal token result shape returned by Better Auth's getAccessToken/refreshToken */
type TokenResult = {
    accessToken?: string;
    accessTokenExpiresAt?: Date | string;
    idToken?: string | null;
};
type EnsureFreshTokenConfig = {
    /** Retrieve the current access token (typically auth.api.getAccessToken) */
    getAccessToken: () => Promise<TokenResult | null>;
    /** Force-refresh using the stored refresh token (typically auth.api.refreshToken) */
    refreshToken: () => Promise<TokenResult | null>;
    /** Buffer in ms before expiry to trigger refresh (default: 5000) */
    refreshBufferMs?: number;
};
/**
 * Check whether a JWT's `exp` claim is expired or within the buffer window.
 * Decodes the payload without signature verification (this is only an expiry
 * gate for refresh decisions, not an auth boundary).
 * @param token - Raw JWT string
 * @param bufferMs - Buffer in ms before expiry to consider "expired"
 * @returns `true` if the token is expired or within the buffer window
 */
declare function isIdTokenExpired(token: string, bufferMs: number): boolean;
/**
 * Get a valid access token, forcing a refresh when needed.
 *
 * Better Auth's `getAccessToken` only refreshes when `accessTokenExpiresAt`
 * is set and past. Stale account data (e.g. created before the OIDC provider
 * returned `expires_in`) has null `accessTokenExpiresAt`, so expired tokens
 * are silently returned. This wrapper detects that case and forces a refresh
 * via `auth.api.refreshToken`.
 *
 * Also checks the id_token `exp` claim — if the id_token is expired or within
 * the buffer window, a refresh is triggered even when the access_token is fresh.
 */
declare function ensureFreshAccessToken(config: EnsureFreshTokenConfig): Promise<TokenResult | null>;
/**
 * Check if an error represents a permanently invalid refresh token.
 * When true, the session should be cleared to force re-authentication.
 *
 * Detects three error shapes:
 * 1. Direct Error with "invalid_grant" in the message
 * 2. Error with a `cause.error === "invalid_grant"` (nested)
 * 3. Better Auth APIError wrapper — BA catches the real error and
 *    re-throws a generic `FAILED_TO_GET_ACCESS_TOKEN` code, hiding
 *    the inner `invalid_grant`. We treat this wrapper as stale tokens
 *    since a persistent token-fetch failure means re-auth is needed.
 */
declare function isInvalidGrant(err: unknown): boolean;
export { ensureFreshAccessToken, isIdTokenExpired, isInvalidGrant };
export type { EnsureFreshTokenConfig, TokenResult };
