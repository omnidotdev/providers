import type { JWTPayload } from "jose";

/** Claim namespace for organization claims in JWT */
const OMNI_CLAIMS_NAMESPACE =
  "https://manifold.omni.dev/@omni/claims/organizations";

type OrganizationClaim = {
  id: string;
  slug: string;
  type: "personal" | "team";
  roles: string[];
  teams: Array<{ id: string; name: string }>;
};

interface TokenPayload extends JWTPayload {
  sub: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
  email?: string;
  [key: string]: unknown;
}

interface UserInfoClaims extends TokenPayload {
  [OMNI_CLAIMS_NAMESPACE]?: OrganizationClaim[];
}

export { OMNI_CLAIMS_NAMESPACE };

export type { OrganizationClaim, TokenPayload, UserInfoClaims };
