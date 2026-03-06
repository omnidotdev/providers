import type { VerifyAccessTokenConfig } from "./jwt";
import type { UserInfoClaims } from "./types";

type ResolveAccessTokenConfig = VerifyAccessTokenConfig & {
  /** Userinfo endpoint URL (e.g. https://identity.omni.dev/oauth2/userinfo) */
  userinfoUrl: string;
};

/**
 * Fetch user claims from the IDP's userinfo endpoint.
 * Validates opaque tokens and enriches JWT claims.
 */
async function fetchUserInfo(
  token: string,
  userinfoUrl: string,
): Promise<UserInfoClaims> {
  const response = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Userinfo request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Resolve an access token into user claims.
 *
 * Supports both JWT and opaque tokens:
 * - JWT (3 dot-separated parts): verified locally via JWKS, then enriched via userinfo
 * - Opaque: validated by the IDP's userinfo endpoint
 *
 * @param token - Raw access token string
 * @param config - Auth service URLs for JWKS and userinfo
 * @returns User claims from the IDP
 */
async function resolveAccessToken(
  token: string,
  config: ResolveAccessTokenConfig,
): Promise<UserInfoClaims> {
  const isJwt = token.split(".").length === 3;

  if (isJwt) {
    // Lazy import to avoid pulling in jose when only opaque tokens are used
    const { verifyAccessToken } = await import("./jwt");
    await verifyAccessToken(token, config);
  }

  return fetchUserInfo(token, config.userinfoUrl);
}

export { fetchUserInfo, resolveAccessToken };

export type { ResolveAccessTokenConfig };
