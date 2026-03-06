import type { VerifyAccessTokenConfig } from "./jwt";
import type { UserInfoClaims } from "./types";
type ResolveAccessTokenConfig = VerifyAccessTokenConfig & {
    /** Userinfo endpoint URL (e.g. https://identity.omni.dev/oauth2/userinfo) */
    userinfoUrl: string;
};
/**
 * Fetch user claims from the IDP's userinfo endpoint.
 * Validates opaque tokens and enriches JWT claims.
 */
declare function fetchUserInfo(token: string, userinfoUrl: string): Promise<UserInfoClaims>;
/**
 * Resolve an access token into user claims.
 *
 * Supports both JWT and opaque tokens:
 * - JWT (3 dot-separated parts): verified locally via JWKS, then enriched via userinfo
 * - Opaque: validated by the IDP's userinfo endpoint
 *
 * @param token - Raw access token string
 * @param config - Auth service URLs for JWKS and userinfo
 * @returns User claims from the IDP
 */
declare function resolveAccessToken(token: string, config: ResolveAccessTokenConfig): Promise<UserInfoClaims>;
export { fetchUserInfo, resolveAccessToken };
export type { ResolveAccessTokenConfig };
