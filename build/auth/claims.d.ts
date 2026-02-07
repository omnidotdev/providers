import type { OrganizationClaim, UserInfoClaims } from "./types";
/**
 * Extract organization claims from a verified JWT payload.
 * @param claims - Verified JWT claims containing org membership
 * @returns Array of organization claims, empty if none found
 */
declare const extractOrgClaims: (claims: UserInfoClaims) => OrganizationClaim[];
export { extractOrgClaims };
