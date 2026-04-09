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
};

/**
 * Check whether a JWT's `exp` claim is expired or within the buffer window.
 * Decodes the payload without signature verification (this is only an expiry
 * gate for refresh decisions, not an auth boundary).
 * @param token - Raw JWT string
 * @param bufferMs - Buffer in ms before expiry to consider "expired"
 * @returns `true` if the token is expired or within the buffer window
 */
function isIdTokenExpired(token: string, bufferMs: number): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expMs = (payload.exp as number) * 1000;

    return expMs - Date.now() < bufferMs;
  } catch {
    // Malformed token — don't trigger a refresh on parse failure
    return false;
  }
}

/**
 * Get a valid access token, refreshing when needed.
 *
 * Better Auth's `getAccessToken` already performs an internal refresh when
 * `accessTokenExpiresAt` is set and the token is near expiry (within 5 s).
 * That internal refresh hits the OIDC provider, which rotates the refresh
 * token (revokes old, issues new).
 *
 * IMPORTANT: We must NOT call `refreshToken` separately after `getAccessToken`
 * has already returned a valid access token. With refresh token rotation, a
 * second refresh attempt would use the OLD refresh token from the request
 * cookies (the cookie update from the first refresh is in the response, not
 * yet visible to subsequent internal API calls). The OIDC provider sees the
 * revoked token and deletes ALL tokens for that client/user, permanently
 * poisoning the session.
 *
 * We only call `refreshToken` when `getAccessToken` returned NO access token
 * at all (e.g. the account cookie is missing or corrupt).
 */
async function ensureFreshAccessToken(
  config: EnsureFreshTokenConfig,
): Promise<TokenResult | null> {
  const result = await config.getAccessToken();

  // If getAccessToken returned a valid token, trust it. BA's internal logic
  // already refreshed if needed. Do not trigger a separate refresh call.
  if (result?.accessToken) {
    return result;
  }

  // No token at all, try refreshing before giving up
  try {
    const refreshed = await config.refreshToken();
    if (refreshed?.accessToken) return refreshed;
  } catch (err) {
    // Permanently invalid grants must propagate so callers can force re-auth
    if (isInvalidGrant(err)) throw err;
  }

  return result;
}

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
function isInvalidGrant(err: unknown): boolean {
  if (err == null || typeof err !== "object") return false;

  // Shape 1: Error with message containing the grant error
  if (
    err instanceof Error &&
    (err.message.includes("invalid_grant") ||
      err.message.includes("invalid refresh token"))
  ) {
    return true;
  }

  // Shape 2: Error with nested cause
  if (
    err instanceof Error &&
    "cause" in err &&
    typeof err.cause === "object" &&
    err.cause !== null &&
    "error" in err.cause &&
    (err.cause as { error: string }).error === "invalid_grant"
  ) {
    return true;
  }

  // Shape 3: Better Auth APIError wrapper (body.code)
  if (
    "body" in err &&
    typeof (err as { body: unknown }).body === "object" &&
    (err as { body: { code?: string } }).body?.code ===
      "FAILED_TO_GET_ACCESS_TOKEN"
  ) {
    return true;
  }

  return false;
}

export { ensureFreshAccessToken, isIdTokenExpired, isInvalidGrant };

export type { EnsureFreshTokenConfig, TokenResult };
