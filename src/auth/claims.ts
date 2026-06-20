import { OMNI_CLAIMS_NAMESPACE } from "./types";

import type { OrganizationClaim, UserInfoClaims } from "./types";

/**
 * Read organization claims from a verified JWT payload, returning undefined when
 * the payload does not carry the org claim at all (e.g. a token issued without
 * the `organization` scope). Lets callers distinguish "no organizations" from
 * "claim absent" so they don't clobber a cached value with an empty array.
 * @param claims - Verified JWT claims
 * @returns Array of organization claims, or undefined when the claim is absent
 */
const readOrgClaims = (
  claims: UserInfoClaims,
): OrganizationClaim[] | undefined => claims[OMNI_CLAIMS_NAMESPACE];

/**
 * Extract organization claims from a verified JWT payload.
 * @param claims - Verified JWT claims containing org membership
 * @returns Array of organization claims, empty if none found
 */
const extractOrgClaims = (claims: UserInfoClaims): OrganizationClaim[] =>
  readOrgClaims(claims) ?? [];

export { extractOrgClaims, readOrgClaims };
