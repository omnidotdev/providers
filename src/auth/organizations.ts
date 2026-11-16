import { readOrgClaims } from "./claims";
import { fetchUserInfo as fetchUserInfoFromUrl } from "./resolve";

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
  hydrate: (
    subject: string | null | undefined,
    accessToken: string | null | undefined,
    opts?: HydrateOptions,
  ) => Promise<OrganizationClaim[] | undefined>;
  /**
   * Resolve the rich organizations for a decoded (already trusted) ID token.
   * A rich claim is returned as-is with no round-trip; a slim claim (ids only)
   * is hydrated from userinfo. Fails closed: empty when the claim is absent or
   * hydration fails, so callers never act on a workspace they cannot describe
   */
  resolve: (
    idTokenClaims: Record<string, unknown>,
    accessToken: string | null | undefined,
    opts?: HydrateOptions,
  ) => Promise<OrganizationClaim[]>;
  /** Drop a user's cached organizations so a membership change shows next read */
  forget: (subject: string) => void;
};

/**
 * Whether an organization claim entry carries the rich shape, not just an id
 * @param org - A claim entry from a token or userinfo
 */
const isRichOrganization = (org: unknown): org is OrganizationClaim =>
  typeof org === "object" &&
  org !== null &&
  typeof (org as { id?: unknown }).id === "string" &&
  typeof (org as { name?: unknown }).name === "string" &&
  typeof (org as { slug?: unknown }).slug === "string";

/**
 * Whether an organization claim lacks display fields and must be hydrated from
 * userinfo (the issuer's slim `{ id }` token shape)
 * @param orgs - Organization claim entries from a token
 */
const isSlimOrganizationClaim = (orgs: readonly unknown[]): boolean =>
  orgs.some((org) => !isRichOrganization(org));

/**
 * Normalize a rich entry so array fields are always present (consumers call
 * `roles.includes` and `teams.map` without guarding)
 * @param org - A rich organization claim entry
 */
const normalizeOrganization = (org: OrganizationClaim): OrganizationClaim => ({
  ...org,
  type: org.type ?? "team",
  roles: Array.isArray(org.roles) ? org.roles : [],
  teams: Array.isArray(org.teams) ? org.teams : [],
});

/**
 * Create a workspace claim hydrator with its own per-process userinfo cache.
 * Create ONE per app (module scope) so the cache is shared across requests
 * @param config - Userinfo source and cache settings
 * @returns `{ hydrate, resolve, forget }`
 */
const createOrganizationHydrator = (
  config: OrganizationHydratorConfig,
): OrganizationHydrator => {
  const {
    userinfoUrl,
    ttlMs = 60_000,
    maxEntries = 5_000,
    now = Date.now,
    logPrefix = "[organizations]",
  } = config;

  const fetchUserInfo =
    config.fetchUserInfo ??
    (userinfoUrl
      ? (accessToken: string) => fetchUserInfoFromUrl(accessToken, userinfoUrl)
      : undefined);

  const cache = new Map<
    string,
    { organizations: OrganizationClaim[]; expiry: number }
  >();

  const remember = (subject: string, organizations: OrganizationClaim[]) => {
    if (ttlMs <= 0) return;
    const at = now();
    if (cache.size >= maxEntries) {
      for (const [key, entry] of cache) {
        if (entry.expiry <= at) cache.delete(key);
      }
      if (cache.size >= maxEntries) cache.clear();
    }
    cache.set(subject, { organizations, expiry: at + ttlMs });
  };

  const hydrate: OrganizationHydrator["hydrate"] = async (
    subject,
    accessToken,
    opts,
  ) => {
    if (!accessToken || !fetchUserInfo) return undefined;

    if (subject && ttlMs > 0 && !opts?.forceRefresh) {
      const cached = cache.get(subject);
      if (cached && cached.expiry > now()) return cached.organizations;
    }

    try {
      const info = await fetchUserInfo(accessToken);

      // OIDC Core 5.3.2: never trust a userinfo response whose subject does not
      // match the session subject
      const infoSub = (info as { sub?: unknown } | null)?.sub;
      if (subject && typeof infoSub === "string" && infoSub !== subject) {
        console.error(
          `${logPrefix} userinfo sub mismatch; ignoring org claims`,
        );
        return undefined;
      }

      const claimed = info ? readOrgClaims(info) : undefined;
      if (!Array.isArray(claimed)) return undefined;

      const organizations = claimed
        .filter(isRichOrganization)
        .map(normalizeOrganization);

      if (subject) remember(subject, organizations);

      return organizations;
    } catch (err) {
      console.error(`${logPrefix} userinfo org hydration failed:`, err);
      return undefined;
    }
  };

  const resolve: OrganizationHydrator["resolve"] = async (
    idTokenClaims,
    accessToken,
    opts,
  ) => {
    const claimed = readOrgClaims(idTokenClaims as UserInfoClaims);
    if (!Array.isArray(claimed) || claimed.length === 0) return [];

    if (!isSlimOrganizationClaim(claimed))
      return claimed.map(normalizeOrganization);

    const subject = idTokenClaims.sub;
    if (typeof subject !== "string") return [];

    return (await hydrate(subject, accessToken, opts)) ?? [];
  };

  const forget: OrganizationHydrator["forget"] = (subject) => {
    cache.delete(subject);
  };

  return { hydrate, resolve, forget };
};

export type {
  HydrateOptions,
  OrganizationHydrator,
  OrganizationHydratorConfig,
};
export { createOrganizationHydrator, isSlimOrganizationClaim };
