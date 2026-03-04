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
 * Get a valid access token, forcing a refresh when needed.
 *
 * Better Auth's `getAccessToken` only refreshes when `accessTokenExpiresAt`
 * is set and past. Stale account data (e.g. created before the OIDC provider
 * returned `expires_in`) has null `accessTokenExpiresAt`, so expired tokens
 * are silently returned. This wrapper detects that case and forces a refresh
 * via `auth.api.refreshToken`.
 */
async function ensureFreshAccessToken(
  config: EnsureFreshTokenConfig,
): Promise<TokenResult | null> {
  const result = await config.getAccessToken();
  if (!result?.accessToken) return result;

  const expiresAt = result.accessTokenExpiresAt;
  const buffer = config.refreshBufferMs ?? 5_000;
  const needsRefresh =
    !expiresAt || new Date(expiresAt).getTime() - Date.now() < buffer;

  if (needsRefresh) {
    try {
      const refreshed = await config.refreshToken();
      if (refreshed?.accessToken) return refreshed;
    } catch {
      // Fall through to original token
    }
  }

  return result;
}

export { ensureFreshAccessToken };

export type { EnsureFreshTokenConfig, TokenResult };
