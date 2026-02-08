import { createRemoteJWKSet, jwtVerify } from "jose";

import type { UserInfoClaims } from "./types";

type VerifyAccessTokenConfig = {
  /** Base URL of the auth service (for JWKS endpoint) */
  authBaseUrl: string;
  /** Expected issuer claim (defaults to authBaseUrl) */
  issuer?: string;
};

/** Cached JWKS instances by auth base URL */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Get or create a JWKS instance for the given auth base URL.
 * jose handles internal JWKS caching and rotation.
 */
function getJWKS(authBaseUrl: string): ReturnType<typeof createRemoteJWKSet> {
  let jwks = jwksCache.get(authBaseUrl);

  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${authBaseUrl}/.well-known/jwks.json`));
    jwksCache.set(authBaseUrl, jwks);
  }

  return jwks;
}

/**
 * Verify a JWT access token using JWKS.
 * Fetches the signing key from the auth service's JWKS endpoint.
 * @param token - Raw JWT string
 * @param config - JWKS verification config
 * @returns Verified JWT claims including organization membership
 * @throws When token is invalid or JWKS endpoint is unreachable
 */
async function verifyAccessToken(
  token: string,
  config: VerifyAccessTokenConfig,
): Promise<UserInfoClaims> {
  const jwks = getJWKS(config.authBaseUrl);

  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.issuer ?? config.authBaseUrl,
  });

  if (!payload.sub) {
    throw new Error("Missing required 'sub' claim");
  }

  return payload as UserInfoClaims;
}

export { verifyAccessToken };

export type { VerifyAccessTokenConfig };
