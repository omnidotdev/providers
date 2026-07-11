import { readOrgClaims } from "./claims";
import { ensureFreshAccessToken, isInvalidGrant } from "./token";

import type { AuthCache } from "./cache";
import type { OidcClient } from "./oidc";
import type { TokenResult } from "./token";
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
  /**
   * TTL (ms) for the in-memory per-user cache of userinfo-hydrated
   * organizations. Once tokens carry org ids only, organizations are hydrated
   * from the userinfo endpoint; without this cache that would be a userinfo
   * round-trip on every request. Short TTL keeps it fresh enough for display
   * data while sparing the IDP. Default 60s; set 0 to disable.
   */
  orgCacheTtlMs?: number;
  /** Clock for the org cache, injectable for tests. Default `Date.now`. */
  now?: () => number;
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
 * The token refresh is single-flighted per session so a page-load request
 * burst never races refresh-token rotation against itself. A refresh failure
 * (including `isInvalidGrant`) never tears down the still-valid session: it
 * degrades to a session without a fresh access token and lets the app's
 * natural 401 -> re-auth path recover a genuinely dead session, rather than
 * force-logging-out a user who merely lost a benign rotation race.
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
    orgCacheTtlMs = 60_000,
    now = Date.now,
  } = config;

  // Per-process cache of userinfo-hydrated organizations, keyed by the OIDC
  // subject. Spares the IDP a userinfo round-trip on every request once tokens
  // carry org ids only. Not a cookie (org lists are unbounded -> HTTP 431), so
  // this lives in memory with a short TTL; staleness is bounded and only
  // affects display fields (authz still flows through the token's org ids).
  const orgCache = new Map<
    string,
    { organizations: OrganizationClaim[]; expiry: number }
  >();

  // Single-flight the token refresh per session. An SSR page load fires many
  // parallel requests carrying the SAME session cookie; without deduping, each
  // one independently refreshes the single-use OAuth token, and all but the
  // winner present a just-rotated token -> the IDP treats it as reuse and the
  // user is logged out in a burst. Sharing one in-flight refresh per session
  // collapses the burst to a single rotation. Keyed by the BA session token;
  // entries are removed as soon as the refresh settles.
  const refreshInFlight = new Map<string, Promise<TokenResult | null>>();

  return async function getAuth(
    request: Request,
  ): Promise<GetAuthSession | null> {
    try {
      const session = await authApi.getSession({
        headers: request.headers,
      });

      if (!session) return null;

      let accessToken: string | undefined;
      // Organizations are unbounded and must never be cached in a cookie (that
      // bloated request headers past the server limit -> HTTP 431 for multi-org
      // users). They are re-derived from the verified ID token on every request
      let organizations: OrganizationClaim[] = [];

      // Access custom session properties added by customSession plugin
      const customUser = session.user as typeof session.user & {
        rowId?: string | null;
        identityProviderId?: string | null;
      };
      let identityProviderId = customUser.identityProviderId;
      let rowId: string | undefined = customUser.rowId ?? undefined;

      // A cached identityProviderId is the marker that getAuth previously wrote
      // the cache for this session, so trust it to skip a redundant rowId
      // resolve. Organizations are intentionally not part of the cache.
      const hasCachedData = !!identityProviderId;

      // Get tokens from Gatekeeper via Better Auth. Concurrent requests for the
      // same session share one refresh (single-flight) so a page-load burst
      // never races refresh-token rotation against itself.
      const sessionKey =
        (session.session?.token as string | undefined) ?? session.user.id;
      try {
        let inFlight = refreshInFlight.get(sessionKey);
        if (!inFlight) {
          inFlight = ensureFreshAccessToken({
            getAccessToken: async () => {
              try {
                const result = await authApi.getAccessToken({
                  body: { providerId },
                  headers: request.headers,
                });

                if (!result?.accessToken) {
                  console.warn(
                    `${logPrefix} getAccessToken returned no token`,
                    {
                      hasResult: !!result,
                    },
                  );
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
          }).finally(() => {
            refreshInFlight.delete(sessionKey);
          });
          refreshInFlight.set(sessionKey, inFlight);
        }
        const tokenResult = await inFlight;
        accessToken = tokenResult?.accessToken;

        if (!accessToken) {
          console.warn(`${logPrefix} No access token after refresh attempt`);
        }

        // Hydrate organizations from the OIDC UserInfo endpoint using the
        // access token. Per OIDC Core 5.3.2 the userinfo `sub` MUST match the
        // session subject before its claims are trusted, so a mismatch is
        // rejected. Cached per subject (TTL) to avoid a round-trip on every
        // request. Used both to enrich slim tokens and to recover orgs when a
        // refresh returns no id token.
        const orgsFromUserInfo = async (
          expectedSub: string | null | undefined,
        ): Promise<OrganizationClaim[] | undefined> => {
          if (!accessToken || typeof oidc.fetchUserInfo !== "function")
            return undefined;

          const cacheKey = expectedSub ?? null;
          const cached =
            cacheKey && orgCacheTtlMs > 0 ? orgCache.get(cacheKey) : undefined;
          if (cached && cached.expiry > now()) return cached.organizations;

          try {
            const info = await oidc.fetchUserInfo(accessToken);

            // OIDC Core 5.3.2: never trust a userinfo response whose subject
            // does not match the session subject.
            const infoSub = (info as { sub?: unknown })?.sub;
            if (
              expectedSub &&
              typeof infoSub === "string" &&
              infoSub !== expectedSub
            ) {
              console.error(
                `${logPrefix} userinfo sub mismatch; ignoring org claims`,
              );
              return undefined;
            }

            const infoOrgs = readOrgClaims(info);
            if (infoOrgs !== undefined && cacheKey && orgCacheTtlMs > 0) {
              orgCache.set(cacheKey, {
                organizations: infoOrgs,
                expiry: now() + orgCacheTtlMs,
              });
            }
            return infoOrgs;
          } catch (infoError) {
            console.error(
              `${logPrefix} userinfo org hydration failed:`,
              infoError,
            );
            return undefined;
          }
        };

        // Extract claims from ID token (verified via OIDC discovery + JWKS)
        if (tokenResult?.idToken) {
          try {
            const payload = await oidc.verifyIdToken(tokenResult.idToken);

            if (!identityProviderId) {
              identityProviderId = payload.sub ?? null;
            }

            // Organizations come straight from the freshly verified token, so
            // claim changes (org logo, membership) propagate on the next token
            // refresh. A token issued without the `organization` scope omits the
            // claim entirely (readOrgClaims -> undefined); leave orgs as-is in
            // that case rather than wiping them to an empty array.
            const tokenOrgs = readOrgClaims(payload);
            if (tokenOrgs !== undefined) {
              organizations = tokenOrgs;
            }

            // Slim-token hydration: once the issuer drops the rich org list from
            // tokens (carrying only `{ id }` to keep request headers bounded),
            // the claim lacks display fields. Hydrate the full shape from
            // userinfo so UIs keep names/logos/roles/teams. Rich tokens are used
            // as-is (no extra round-trip), so this is a no-op until the issuer
            // slims the claim. A token without the org scope (undefined) is left
            // alone — userinfo would not carry it either.
            const needsHydration =
              organizations.length > 0 &&
              organizations.some(
                (org) => (org as Partial<OrganizationClaim>).name === undefined,
              );

            if (needsHydration) {
              const hydrated = await orgsFromUserInfo(
                identityProviderId ?? payload.sub,
              );
              if (hydrated !== undefined) organizations = hydrated;
            }
          } catch (jwtError) {
            console.error(`${logPrefix} JWT verification failed:`, jwtError);
          }
        }

        // No id token (e.g. a refresh that did not re-issue one), or a token
        // that carried no org claim: recover organizations from userinfo so the
        // dashboard does not lose every workspace after a token refresh (the id
        // token is only issued at login, not on the refresh-token grant).
        if (organizations.length === 0) {
          const recovered = await orgsFromUserInfo(identityProviderId);
          if (recovered !== undefined) organizations = recovered;
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
        // A failed token refresh must NOT tear down a still-valid session. The
        // BA session (getSession above) is intact; the refresh most often fails
        // only because a concurrent SSR request already rotated the single-use
        // refresh token. Signing out here logged users out in bursts on every
        // app re-open. Degrade instead: serve the session without a fresh
        // access token. A genuinely dead session self-heals on the next request
        // via the app's 401 -> re-auth redirect, without punishing the benign
        // rotation race.
        if (isInvalidGrant(err)) {
          console.warn(
            `${logPrefix} Token refresh failed (likely a rotation race); serving session without a fresh access token`,
          );
        } else {
          console.error(`${logPrefix} Token fetch error:`, err);
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
