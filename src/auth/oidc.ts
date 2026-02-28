import { createRemoteJWKSet, jwtVerify } from "jose";

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

const DISCOVERY_TTL = 24 * 60 * 60 * 1000; // 24h
const JWKS_TTL = 60 * 60 * 1000; // 1h

/**
 * Create an OIDC Discovery client with JWKS caching.
 * Replaces per-app inline OIDC/JWKS boilerplate.
 * @param config - OIDC client configuration
 * @returns OIDC client with verifyIdToken, getDiscovery, getJwks, clearCache
 */
function createOidcClient(config: OidcClientConfig): OidcClient {
  let discoveryCache: OidcDiscovery | null = null;
  let discoveryExpiry = 0;
  let jwksCache: JWTVerifyGetKey | null = null;
  let jwksExpiry = 0;

  async function getDiscovery(): Promise<OidcDiscovery> {
    const now = Date.now();

    if (discoveryCache && now < discoveryExpiry) return discoveryCache;

    const url = new URL(
      "/.well-known/openid-configuration",
      config.authBaseUrl,
    );
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `OIDC discovery failed: ${response.status} ${response.statusText}`,
      );
    }

    const discovery = (await response.json()) as OidcDiscovery;

    if (!discovery.issuer || !discovery.jwks_uri) {
      throw new Error("Invalid OIDC discovery document");
    }

    discoveryCache = discovery;
    discoveryExpiry = now + DISCOVERY_TTL;

    return discovery;
  }

  async function getJwks(): Promise<JWTVerifyGetKey> {
    const now = Date.now();

    if (jwksCache && now < jwksExpiry) return jwksCache;

    const discovery = await getDiscovery();
    jwksCache = createRemoteJWKSet(new URL(discovery.jwks_uri), {
      timeoutDuration: 15_000,
      cooldownDuration: 30_000,
    });
    jwksExpiry = now + JWKS_TTL;

    return jwksCache;
  }

  async function verifyIdToken(token: string): Promise<UserInfoClaims> {
    const [discovery, jwks] = await Promise.all([
      getDiscovery(),
      getJwks(),
    ]);

    const { payload } = await jwtVerify(token, jwks, {
      issuer: discovery.issuer,
    });

    if (!payload.sub) {
      throw new Error("Missing required 'sub' claim");
    }

    return payload as UserInfoClaims;
  }

  function clearCache(): void {
    discoveryCache = null;
    discoveryExpiry = 0;
    jwksCache = null;
    jwksExpiry = 0;
  }

  return { verifyIdToken, getDiscovery, getJwks, clearCache };
}

export { createOidcClient };

export type { OidcClient, OidcClientConfig, OidcDiscovery };
