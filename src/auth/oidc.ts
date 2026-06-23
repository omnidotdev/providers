import { createRemoteJWKSet, jwtVerify } from "jose";

import type { JWTVerifyGetKey } from "jose";
import type { UserInfoClaims } from "./types";

/** OIDC Discovery document structure */
type OidcDiscovery = {
  issuer: string;
  jwks_uri: string;
  /** Userinfo endpoint, used to fetch claims (e.g. org details) by access token */
  userinfo_endpoint?: string;
};

type OidcClientConfig = {
  /** Base URL of the auth service (e.g. https://auth.omni.dev) */
  authBaseUrl: string;
};

type OidcClient = {
  /** Verify an ID token JWT using OIDC discovery + JWKS */
  verifyIdToken: (token: string) => Promise<UserInfoClaims>;
  /** Fetch userinfo claims (e.g. org details) for an access token */
  fetchUserInfo: (accessToken: string) => Promise<UserInfoClaims>;
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

    // Rewrite jwks_uri to use authBaseUrl — the discovery document returns
    // external URLs (e.g. localhost:3001) which are unreachable from Docker
    // containers. Use the internal URL we were configured with instead.
    const jwksUrl = new URL(discovery.jwks_uri);
    const baseUrl = new URL(config.authBaseUrl);
    jwksUrl.protocol = baseUrl.protocol;
    jwksUrl.host = baseUrl.host;

    jwksCache = createRemoteJWKSet(jwksUrl, {
      timeoutDuration: 15_000,
      cooldownDuration: 30_000,
    });
    jwksExpiry = now + JWKS_TTL;

    return jwksCache;
  }

  async function verifyIdToken(token: string): Promise<UserInfoClaims> {
    const [discovery, jwks] = await Promise.all([getDiscovery(), getJwks()]);

    const { payload } = await jwtVerify(token, jwks, {
      issuer: discovery.issuer,
    });

    if (!payload.sub) {
      throw new Error("Missing required 'sub' claim");
    }

    return payload as UserInfoClaims;
  }

  /**
   * Fetch userinfo claims for an access token. Used to hydrate rich org details
   * (name/slug/logo/roles/teams) when the token's organizations claim carries
   * only ids — so tokens stay small (no unbounded org list inflating request
   * headers) while UIs still get the full org shape. Returns the same
   * `UserInfoClaims` shape as the ID token, including the namespaced org claim
   */
  async function fetchUserInfo(accessToken: string): Promise<UserInfoClaims> {
    const discovery = await getDiscovery();

    // Discovery may return an external host (e.g. localhost:3001) unreachable
    // from inside a container; rewrite to the configured internal base URL,
    // mirroring the jwks_uri handling above
    const endpoint = new URL(
      discovery.userinfo_endpoint ?? "/oauth2/userinfo",
      config.authBaseUrl,
    );
    const baseUrl = new URL(config.authBaseUrl);
    endpoint.protocol = baseUrl.protocol;
    endpoint.host = baseUrl.host;

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `OIDC userinfo failed: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as UserInfoClaims;
  }

  function clearCache(): void {
    discoveryCache = null;
    discoveryExpiry = 0;
    jwksCache = null;
    jwksExpiry = 0;
  }

  return { verifyIdToken, fetchUserInfo, getDiscovery, getJwks, clearCache };
}

export { createOidcClient };

export type { OidcClient, OidcClientConfig, OidcDiscovery };
