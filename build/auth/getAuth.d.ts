import type { AuthCache } from "./cache";
import type { OidcClient } from "./oidc";
import type { OrganizationClaim } from "./types";
/**
 * Minimal Better Auth API surface required by `createGetAuth`.
 * Apps pass their BA instance and the factory uses only these methods,
 * keeping providers decoupled from Better Auth's full type surface.
 */
type BetterAuthApi = {
    getSession: (opts: {
        headers: Headers;
    }) => Promise<{
        user: {
            id: string;
            [key: string]: any;
        };
        [key: string]: any;
    } | null>;
    getAccessToken: (opts: {
        body: {
            providerId: string;
        };
        headers: Headers;
    }) => Promise<{
        accessToken?: string;
        accessTokenExpiresAt?: Date | string;
        idToken?: string | null;
    } | null>;
    refreshToken: (opts: {
        body: {
            providerId: string;
        };
        headers: Headers;
    }) => Promise<{
        accessToken?: string;
        accessTokenExpiresAt?: Date | string;
        idToken?: string | null;
    } | null>;
    signOut: (opts: {
        headers: Headers;
    }) => Promise<unknown>;
};
type SetCookieFn = (name: string, value: string, options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
}) => void;
type ResolveRowIdParams = {
    /** OIDC `sub` claim — stable identity-provider user identifier */
    identityProviderId: string;
    /** Fresh access token for calling the consuming app's API */
    accessToken: string;
    /** Better Auth user record (includes `id`, `email`, plugin fields) */
    user: {
        id: string;
        email: string;
        [key: string]: unknown;
    };
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
        [key: string]: any;
    };
    session: {
        token: string;
        expiresAt: Date | string;
        [key: string]: any;
    };
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
declare function createGetAuth(config: GetAuthConfig): (request: Request) => Promise<GetAuthSession | null>;
export { createGetAuth };
export type { BetterAuthApi, GetAuthConfig, GetAuthSession, ResolveRowIdFn, ResolveRowIdParams, SetCookieFn, };
