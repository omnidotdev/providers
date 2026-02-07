import { QueryClient } from "@tanstack/query-core";
import type { OrganizationClaim, UserInfoClaims } from "../auth/types";
/** Authentication error with a machine-readable code */
declare class AuthenticationError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
/**
 * Validate token claims (expiry, issued-at, issuer).
 * @param claims - Verified JWT claims
 * @param config - Optional validation config
 */
declare const validateClaims: (claims: UserInfoClaims, config?: {
    expectedIssuer?: string;
}) => void;
/**
 * Check if a GraphQL query is an introspection query.
 * Introspection queries contain `__schema` or `IntrospectionQuery`.
 */
declare const isIntrospectionQuery: (query: string | undefined) => boolean;
/**
 * Extract a bearer token from an Authorization header value.
 * @param header - Raw Authorization header value
 * @returns Token string or undefined
 */
declare const extractBearerToken: (header: string | null) => string | undefined;
/**
 * Create a QueryClient configured for auth caching.
 * Uses 2-minute stale time with no retry.
 */
declare const createAuthQueryClient: () => QueryClient;
/**
 * Create a function that extracts organization claims from
 * cached userinfo for a given access token.
 * @param queryClient - QueryClient instance used by the auth plugin
 */
declare const createGetOrganizationClaimsFromCache: (queryClient: QueryClient) => ((accessToken: string) => OrganizationClaim[]);
export { AuthenticationError, createAuthQueryClient, createGetOrganizationClaimsFromCache, extractBearerToken, isIntrospectionQuery, validateClaims, };
