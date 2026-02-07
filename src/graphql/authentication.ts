import { QueryClient } from "@tanstack/query-core";

import { OMNI_CLAIMS_NAMESPACE } from "../auth/types";

import type { OrganizationClaim, UserInfoClaims } from "../auth/types";

/** Authentication error with a machine-readable code */
class AuthenticationError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

/**
 * Validate token claims (expiry, issued-at, issuer).
 * @param claims - Verified JWT claims
 * @param config - Optional validation config
 */
const validateClaims = (
  claims: UserInfoClaims,
  config?: { expectedIssuer?: string },
): void => {
  const now = Math.floor(Date.now() / 1000);

  if (claims.exp !== undefined && claims.exp < now) {
    throw new AuthenticationError("Token has expired", "TOKEN_EXPIRED");
  }

  // Reject tokens issued in the future (60s clock skew allowance)
  if (claims.iat !== undefined && claims.iat > now + 60) {
    throw new AuthenticationError(
      "Token issued in the future",
      "INVALID_TOKEN_IAT",
    );
  }

  const issuer = config?.expectedIssuer;
  if (issuer && claims.iss !== undefined && claims.iss !== issuer) {
    throw new AuthenticationError(
      "Token issuer mismatch",
      "INVALID_TOKEN_ISSUER",
    );
  }
};

/**
 * Check if a GraphQL query is an introspection query.
 * Introspection queries contain `__schema` or `IntrospectionQuery`.
 */
const isIntrospectionQuery = (query: string | undefined): boolean => {
  if (!query) return false;

  return query.includes("__schema") || query.includes("IntrospectionQuery");
};

/**
 * Extract a bearer token from an Authorization header value.
 * @param header - Raw Authorization header value
 * @returns Token string or undefined
 */
const extractBearerToken = (header: string | null): string | undefined => {
  return header?.split("Bearer ")[1];
};

/**
 * Create a QueryClient configured for auth caching.
 * Uses 2-minute stale time with no retry.
 */
const createAuthQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // 2 minutes in ms
        staleTime: 120_000,
      },
    },
  });
};

/**
 * Create a function that extracts organization claims from
 * cached userinfo for a given access token.
 * @param queryClient - QueryClient instance used by the auth plugin
 */
const createGetOrganizationClaimsFromCache = (
  queryClient: QueryClient,
): ((accessToken: string) => OrganizationClaim[]) => {
  return (accessToken: string): OrganizationClaim[] => {
    const cached = queryClient.getQueryData<UserInfoClaims>([
      "UserInfo",
      { accessToken },
    ]);
    return cached?.[OMNI_CLAIMS_NAMESPACE] ?? [];
  };
};

export {
  AuthenticationError,
  createAuthQueryClient,
  createGetOrganizationClaimsFromCache,
  extractBearerToken,
  isIntrospectionQuery,
  validateClaims,
};
