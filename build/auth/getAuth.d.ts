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
 * On `isInvalidGrant`, clears both the session and cache cookie to
 * force re-authentication. On other token errors, returns the session
 * with whatever organizations are cached (graceful degradation).
 * @param config - Auth configuration
 * @returns `getAuth(request)` function that resolves to session or null
 */
declare function createGetAuth(config: GetAuthConfig): (request: Request) => Promise<GetAuthSession | null>;
export { createGetAuth };
export type { BetterAuthApi, GetAuthConfig, GetAuthSession, SetCookieFn, };
