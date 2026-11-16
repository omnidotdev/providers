import type { OrganizationClaim, UserInfoClaims } from "./types";
/**
 * Workspace (organization) claim hydration.
 *
 * Gatekeeper's organization claim is unbounded: it grows with every workspace a
 * user joins. The rich shape (name/slug/logo/roles/teams) inflated the auth
 * cookie past the 16 KB request-header limit (HTTP 431) for users in many
 * workspaces, so tokens carry `{ id }` only once the issuer slims them, and the
 * rich details come from the userinfo endpoint, which always keeps them. This
 * module is the one place that turns a token's org claim (rich OR slim) into the
 * rich `OrganizationClaim[]` every app consumes, caching the userinfo lookup in
 * memory (never in a cookie) per user for a short TTL
 */
type OrganizationHydratorConfig = {
    /**
     * Fetch the caller's userinfo claims with their access token (e.g.
     * `oidc.fetchUserInfo` from `createOidcClient`). Takes precedence over
     * `userinfoUrl`
     */
    fetchUserInfo?: (accessToken: string) => Promise<UserInfoClaims>;
    /** Gatekeeper userinfo endpoint, e.g. `${AUTH_BASE_URL}/oauth2/userinfo` */
    userinfoUrl?: string;
    /** How long hydrated organizations are reused (ms). Default 60s; 0 disables */
    ttlMs?: number;
    /** Bound on cached users so the cache can never grow without limit. Default 5000 */
    maxEntries?: number;
    /** Clock, injectable for tests. Default `Date.now` */
    now?: () => number;
    /** Log prefix for console output. Default "[organizations]" */
    logPrefix?: string;
};
type HydrateOptions = {
    /**
     * Skip the cache read and fetch live from userinfo (the fresh result is still
     * cached). Use on surfaces that must reflect a workspace created out-of-band
     */
    forceRefresh?: boolean;
};
type OrganizationHydrator = {
    /**
     * Fetch the user's rich organizations from userinfo, cached per subject.
     * When `subject` is given, a userinfo response for any other subject is
     * rejected (OIDC Core 5.3.2). Resolves `undefined` when userinfo is
     * unavailable, fails, or carries no organization claim
     */
    hydrate: (subject: string | null | undefined, accessToken: string | null | undefined, opts?: HydrateOptions) => Promise<OrganizationClaim[] | undefined>;
    /**
     * Resolve the rich organizations for a decoded (already trusted) ID token.
     * A rich claim is returned as-is with no round-trip; a slim claim (ids only)
     * is hydrated from userinfo. Fails closed: empty when the claim is absent or
     * hydration fails, so callers never act on a workspace they cannot describe
     */
    resolve: (idTokenClaims: Record<string, unknown>, accessToken: string | null | undefined, opts?: HydrateOptions) => Promise<OrganizationClaim[]>;
    /** Drop a user's cached organizations so a membership change shows next read */
    forget: (subject: string) => void;
};
/**
 * Whether an organization claim lacks display fields and must be hydrated from
 * userinfo (the issuer's slim `{ id }` token shape)
 * @param orgs - Organization claim entries from a token
 */
declare const isSlimOrganizationClaim: (orgs: readonly unknown[]) => boolean;
/**
 * Create a workspace claim hydrator with its own per-process userinfo cache.
 * Create ONE per app (module scope) so the cache is shared across requests
 * @param config - Userinfo source and cache settings
 * @returns `{ hydrate, resolve, forget }`
 */
declare const createOrganizationHydrator: (config: OrganizationHydratorConfig) => OrganizationHydrator;
export type { HydrateOptions, OrganizationHydrator, OrganizationHydratorConfig, };
export { createOrganizationHydrator, isSlimOrganizationClaim };
