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
async function ensureFreshAccessToken(
  config: EnsureFreshTokenConfig,
): Promise<TokenResult | null> {
  const result = await config.getAccessToken();

  // If no token at all, try refreshing before giving up
  if (!result?.accessToken) {
    try {
      const refreshed = await config.refreshToken();
      if (refreshed?.accessToken) return refreshed;
    } catch {
      // Refresh failed — no token available
    }
    return result;
  }

  const expiresAt = result.accessTokenExpiresAt;
  const buffer = config.refreshBufferMs ?? 5_000;
  const accessTokenNeedsRefresh =
    !expiresAt || new Date(expiresAt).getTime() - Date.now() < buffer;

  const idTokenNeedsRefresh =
    !!result.idToken && isIdTokenExpired(result.idToken, buffer);

  if (accessTokenNeedsRefresh || idTokenNeedsRefresh) {
    try {
      const refreshed = await config.refreshToken();
      if (refreshed?.accessToken) return refreshed;
    } catch {
      // Fall through to original token
    }
  }

  return result;
}

/**
 * Check if an error represents a permanently invalid refresh token.
 * When true, the session should be cleared to force re-authentication.
 */
function isInvalidGrant(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  if (
    err.message.includes("invalid_grant") ||
    err.message.includes("invalid refresh token")
  ) {
    return true;
  }

  if (
    "cause" in err &&
    typeof err.cause === "object" &&
    err.cause !== null &&
    "error" in err.cause &&
    (err.cause as { error: string }).error === "invalid_grant"
  ) {
    return true;
  }

  return false;
}

export { ensureFreshAccessToken, isIdTokenExpired, isInvalidGrant };

export type { EnsureFreshTokenConfig, TokenResult };
