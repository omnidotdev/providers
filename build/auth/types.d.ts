import type { JWTPayload } from "jose";
/** Claim namespace for organization claims in JWT */
declare const OMNI_CLAIMS_NAMESPACE = "https://manifold.omni.dev/@omni/claims/organizations";
/** Organization membership claim embedded in a JWT */
type OrganizationClaim = {
    id: string;
    name: string;
    slug: string;
    type: "personal" | "team";
    roles: string[];
    teams: Array<{
        id: string;
        name: string;
    }>;
};
/** Base JWT payload with standard user identity claims */
interface TokenPayload extends JWTPayload {
    sub: string;
    name?: string;
    preferred_username?: string;
    picture?: string;
    email?: string;
    [key: string]: unknown;
}
/** Extended JWT payload including organization claims */
interface UserInfoClaims extends TokenPayload {
    [OMNI_CLAIMS_NAMESPACE]?: OrganizationClaim[];
}
export { OMNI_CLAIMS_NAMESPACE };
export type { OrganizationClaim, TokenPayload, UserInfoClaims };
