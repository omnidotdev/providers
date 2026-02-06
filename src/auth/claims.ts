import { OMNI_CLAIMS_NAMESPACE } from "./types";

import type { OrganizationClaim, UserInfoClaims } from "./types";

/**
 * Extract organization claims from a verified JWT payload.
 * @param claims - Verified JWT claims containing org membership
 * @returns Array of organization claims, empty if none found
 */
const extractOrgClaims = (claims: UserInfoClaims): OrganizationClaim[] => {
  return claims[OMNI_CLAIMS_NAMESPACE] ?? [];
};

export { extractOrgClaims };
