import { extractOrgClaims } from "./claims";
import { ensureFreshAccessToken, isInvalidGrant } from "./token";

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

type ResolveRowIdParams = {
  /** OIDC `sub` claim — stable identity-provider user identifier */
  identityProviderId: string;
  /** Fresh access token for calling the consuming app's API */
  accessToken: string;
  /** Better Auth user record (includes `id`, `email`, plugin fields) */
  user: { id: string; email: string; [key: string]: unknown };
};

type ResolveRowIdFn = (params: ResolveRowIdParams) => Promise<string | null>;

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
  /**
   * Resolve the consuming app's user-row UUID for the authenticated caller.
   * Called once on cache miss after the access token and `identityProviderId`
   * are available. The resolved value is stored in the encrypted cache cookie
   * and exposed as `session.user.rowId` on subsequent requests.
   *
   * Without this resolver, `session.user.rowId` is left undefined — the
   * Better Auth `user.id` is NOT a substitute, since it is not the consuming
   * app's row UUID.
   *
   * Resolver errors are logged and swallowed so transient failures don't
   * collapse the session; `rowId` simply remains unset until a later request
   * succeeds.
   */
  resolveRowId?: ResolveRowIdFn;
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
    /**
     * Consuming app's user-row UUID. Populated via the `resolveRowId`
     * callback supplied to `createGetAuth`; undefined if no resolver was
     * configured or the resolver has not yet succeeded.
     */
    rowId?: string;
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
    resolveRowId,
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
        rowId?: string | null;
        identityProviderId?: string | null;
        organizations?: OrganizationClaim[];
      };
      let identityProviderId = customUser.identityProviderId;
      let rowId: string | undefined = customUser.rowId ?? undefined;
      const cachedOrganizations = customUser.organizations;

      // A cached identityProviderId is the marker that getAuth previously wrote
      // the cache for this session, so trust it to skip OIDC verify on every
      // request. Do NOT also require cached organizations: a user with zero org
      // claims is a valid, fully-cached state, and gating on org count left such
      // users uncached forever (rowId never resolved).
      const hasCachedData = !!identityProviderId;

      if (hasCachedData) {
        organizations = cachedOrganizations ?? [];
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

        // Retry rowId resolution whenever it is still missing, even for an
        // already-cached session. The cache cookie is keyed on
        // identityProviderId, so a session cached before rowId resolved (the
        // API user did not exist yet, or a transient resolver failure) would
        // otherwise have hasCachedData=true forever and never re-attempt,
        // stranding the user until the cookie expired. Resolving on cache hit
        // makes rowId self-healing across requests without forcing re-auth.
        const needsRowId =
          !!resolveRowId && rowId === undefined && !!accessToken;

        // Write cache on first successful token decode (cache miss path), or
        // when retrying rowId resolution for an already-cached session.
        // Gate on identity only: an authenticated user with no organizations
        // must still be cached so rowId resolves and we stop re-verifying.
        if (identityProviderId && (!hasCachedData || needsRowId)) {
          if (resolveRowId && accessToken && rowId === undefined) {
            try {
              const resolved = await resolveRowId({
                identityProviderId,
                accessToken,
                user: session.user as ResolveRowIdParams["user"],
              });
              if (resolved) rowId = resolved;
            } catch (resolveErr) {
              console.error(
                `${logPrefix} resolveRowId failed:`,
                resolveErr instanceof Error
                  ? resolveErr.message
                  : String(resolveErr),
              );
            }
          }

          const encrypted = await authCache.encrypt({
            ...(rowId !== undefined ? { rowId } : {}),
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
          ...(rowId !== undefined ? { rowId } : {}),
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

export type {
  BetterAuthApi,
  GetAuthConfig,
  GetAuthSession,
  ResolveRowIdFn,
  ResolveRowIdParams,
  SetCookieFn,
};
