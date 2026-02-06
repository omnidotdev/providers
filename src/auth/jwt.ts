import { createRemoteJWKSet, jwtVerify } from "jose";

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
 * Derive a symmetric key from a secret string via HKDF-SHA256.
 */
async function deriveKey(secret: string, salt: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "HKDF",
    false,
    ["deriveBits"],
  );

  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: encoder.encode(salt),
        info: encoder.encode("jwt-signing-key"),
      },
      keyMaterial,
      256,
    ),
  );
}

/**
 * Verify a JWT access token using JWKS (SaaS mode).
 * Fetches the signing key from the auth service's JWKS endpoint.
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

/**
 * Verify a self-hosted JWT signed with a symmetric secret.
 * Supports key rotation by trying current secret first, then previous.
 * @throws When token is invalid or secrets are not configured
 */
async function verifySelfHostedToken(
  token: string,
  config: VerifySelfHostedTokenConfig,
): Promise<UserInfoClaims> {
  const salt = config.salt ?? "self-hosted-auth";
  const issuer = config.issuer ?? "self-hosted";

  const keys = [await deriveKey(config.secret, salt)];

  if (config.previousSecret) {
    keys.push(await deriveKey(config.previousSecret, salt));
  }

  for (const key of keys) {
    try {
      const { payload } = await jwtVerify(token, key, { issuer });

      if (!payload.sub) {
        throw new Error("Missing required 'sub' claim");
      }

      return payload as UserInfoClaims;
    } catch (err) {
      // If this is the last key, rethrow
      if (key === keys[keys.length - 1]) throw err;
    }
  }

  // Unreachable, but satisfies TypeScript
  throw new Error("Token verification failed");
}

export { verifyAccessToken, verifySelfHostedToken };

export type { VerifyAccessTokenConfig, VerifySelfHostedTokenConfig };
