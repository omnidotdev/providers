import { ensureFreshAccessToken, isInvalidGrant } from "./token";
import { extractOrgClaims } from "./claims";

import type { AuthCache } from "./cache";
import type { OidcClient } from "./oidc";
import type { OrganizationClaim } from "./types";

/**
 * Minimal Better Auth API surface required by `createGetAuth`.
 * Apps pass their BA instance and the factory uses only these methods,
 * keeping providers decoupled from Better Auth's full type surface.
 */
type BetterAuthApi = {
  getSession: (opts: { headers: Headers }) => Promise<{
    user: {
      id: string; // biome-ignore lint/suspicious/noExplicitAny: dynamic BA plugin fields
      [key: string]: any;
    }; // biome-ignore lint/suspicious/noExplicitAny: dynamic BA plugin fields
    [key: string]: any;
  } | null>;
  getAccessToken: (opts: {
    body: { providerId: string };
    headers: Headers;
  }) => Promise<{
    accessToken?: string;
    accessTokenExpiresAt?: Date | string;
    idToken?: string | null;
  } | null>;
  refreshToken: (opts: {
    body: { providerId: string };
    headers: Headers;
  }) => Promise<{
    accessToken?: string;
    accessTokenExpiresAt?: Date | string;
    idToken?: string | null;
  } | null>;
  signOut: (opts: { headers: Headers }) => Promise<unknown>;
};

type SetCookieFn = (
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
  },
) => void;

type GetAuthConfig = {
  /** Better Auth server instance (`auth.api`) */
  authApi: BetterAuthApi;
  /** OIDC client for ID token verification (from `createOidcClient`) */
  oidc: OidcClient;
  /** Auth cache for encrypted cookie storage (from `createAuthCache`) */
  authCache: AuthCache;
  /** Cookie setter (e.g. `setCookie` from `@tanstack/react-start/server`) */
  setCookie: SetCookieFn;
  /** OAuth provider ID (default: "omni") */
  providerId?: string;
  /** Log prefix for console output (default: "[getAuth]") */
  logPrefix?: string;
};

type GetAuthSession = {
  accessToken?: string;
  organizations: OrganizationClaim[];
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    identityProviderId?: string | null;
    // biome-ignore lint/suspicious/noExplicitAny: dynamic BA plugin fields
    [key: string]: any;
  };
  session: {
    token: string;
    expiresAt: Date | string;
    // biome-ignore lint/suspicious/noExplicitAny: dynamic BA plugin fields
    [key: string]: any;
  };
  // biome-ignore lint/suspicious/noExplicitAny: dynamic BA plugin fields
  [key: string]: any;
};

/**
 * Create a `getAuth` function for an Omni app.
 *
 * Encapsulates the standard auth flow: session lookup, token refresh
 * via `ensureFreshAccessToken`, OIDC-verified ID token decoding,
 * organization claim extraction, and encrypted cookie caching.
 *
 * On `isInvalidGrant`, clears both the session and cache cookie to
 * force re-authentication. On other token errors, returns the session
 * with whatever organizations are cached (graceful degradation).
 * @param config - Auth configuration
 * @returns `getAuth(request)` function that resolves to session or null
 */
function createGetAuth(config: GetAuthConfig) {
  const {
    authApi,
    oidc,
    authCache,
    setCookie,
    providerId = "omni",
    logPrefix = "[getAuth]",
  } = config;

  return async function getAuth(
    request: Request,
  ): Promise<GetAuthSession | null> {
    try {
      const session = await authApi.getSession({
        headers: request.headers,
      });

      if (!session) return null;

      let accessToken: string | undefined;
      let organizations: OrganizationClaim[] = [];

      // Access custom session properties added by customSession plugin
      const customUser = session.user as typeof session.user & {
        identityProviderId?: string | null;
        organizations?: OrganizationClaim[];
      };
      let identityProviderId = customUser.identityProviderId;
      const cachedOrganizations = customUser.organizations;

      // Check if we have complete cached data (avoids OIDC verify on every request)
      const hasCachedData = identityProviderId && cachedOrganizations?.length;

      if (hasCachedData) {
        organizations = cachedOrganizations;
      }

      // Get tokens from Gatekeeper via Better Auth
      try {
        const tokenResult = await ensureFreshAccessToken({
          getAccessToken: async () => {
            try {
              const result = await authApi.getAccessToken({
                body: { providerId },
                headers: request.headers,
              });

              if (!result?.accessToken) {
                console.warn(`${logPrefix} getAccessToken returned no token`, {
                  hasResult: !!result,
                });
              }

              return result;
            } catch (err) {
              const body =
                err && typeof err === "object" && "body" in err
                  ? (err as { body: unknown }).body
                  : undefined;
              console.error(`${logPrefix} getAccessToken failed:`, {
                code:
                  body && typeof body === "object" && "code" in body
                    ? (body as { code: string }).code
                    : "unknown",
                message: err instanceof Error ? err.message : String(err),
              });
              throw err;
            }
          },
          refreshToken: async () => {
            try {
              return await authApi.refreshToken({
                body: { providerId },
                headers: request.headers,
              });
            } catch (err) {
              console.error(
                `${logPrefix} refreshToken failed:`,
                err instanceof Error ? err.message : String(err),
              );
              throw err;
            }
          },
        });
        accessToken = tokenResult?.accessToken;

        if (!accessToken) {
          console.warn(`${logPrefix} No access token after refresh attempt`);
        }

        // Extract claims from ID token (verified via OIDC discovery + JWKS)
        if (tokenResult?.idToken) {
          try {
            const payload = await oidc.verifyIdToken(tokenResult.idToken);

            if (!identityProviderId) {
              identityProviderId = payload.sub ?? null;
            }

            if (!hasCachedData) {
              organizations = extractOrgClaims(payload);
            }
          } catch (jwtError) {
            console.error(`${logPrefix} JWT verification failed:`, jwtError);
          }
        }

        // Write cache on first successful token decode (cache miss path)
        if (!hasCachedData && identityProviderId && organizations.length) {
          const encrypted = await authCache.encrypt({
            rowId: session.user.id,
            identityProviderId,
            organizations,
          });
          setCookie(authCache.cookieName, encrypted, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: authCache.cookieTtlSeconds,
          });
        }
      } catch (err) {
        console.error(`${logPrefix} Token fetch error:`, err);

        if (isInvalidGrant(err)) {
          console.warn(
            `${logPrefix} Stale OAuth tokens, clearing session for re-auth`,
          );
          try {
            await authApi.signOut({ headers: request.headers });
          } catch {
            // Sign-out may fail if session is already corrupt
          }
          setCookie(authCache.cookieName, "", { maxAge: 0, path: "/" });
          return null;
        }
      }

      return {
        ...session,
        accessToken,
        organizations,
        user: {
          ...session.user,
          // Always set rowId from the BA user ID so it's available on the
          // first request after OAuth (before the cache cookie round-trips)
          rowId: session.user.id,
          identityProviderId,
        },
      } as GetAuthSession;
    } catch (error) {
      console.error("Failed to get auth session:", error);
      return null;
    }
  };
}

export { createGetAuth };

export type { BetterAuthApi, GetAuthConfig, GetAuthSession, SetCookieFn };
