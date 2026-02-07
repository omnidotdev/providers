import { describe, expect, it } from "bun:test";

import {
  AuthenticationError,
  createAuthQueryClient,
  createGetOrganizationClaimsFromCache,
  extractBearerToken,
  isIntrospectionQuery,
  validateClaims,
} from "../../src/graphql/authentication";

import type { UserInfoClaims } from "../../src/auth/types";

describe("AuthenticationError", () => {
  it("stores code and message", () => {
    const err = new AuthenticationError("expired", "TOKEN_EXPIRED");
    expect(err.message).toBe("expired");
    expect(err.code).toBe("TOKEN_EXPIRED");
    expect(err.name).toBe("AuthenticationError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("validateClaims", () => {
  const baseClaims: UserInfoClaims = {
    sub: "user-1",
    iss: "https://auth.example.com",
    iat: Math.floor(Date.now() / 1000) - 10,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  it("passes for valid claims", () => {
    expect(() => validateClaims(baseClaims)).not.toThrow();
  });

  it("throws on expired token", () => {
    const claims: UserInfoClaims = {
      ...baseClaims,
      exp: Math.floor(Date.now() / 1000) - 100,
    };
    expect(() => validateClaims(claims)).toThrow("Token has expired");
  });

  it("throws on future iat beyond skew", () => {
    const claims: UserInfoClaims = {
      ...baseClaims,
      iat: Math.floor(Date.now() / 1000) + 120,
    };
    expect(() => validateClaims(claims)).toThrow("Token issued in the future");
  });

  it("allows iat within 60s clock skew", () => {
    const claims: UserInfoClaims = {
      ...baseClaims,
      iat: Math.floor(Date.now() / 1000) + 30,
    };
    expect(() => validateClaims(claims)).not.toThrow();
  });

  it("throws on issuer mismatch", () => {
    const claims: UserInfoClaims = {
      ...baseClaims,
      iss: "https://evil.example.com",
    };
    expect(() =>
      validateClaims(claims, {
        expectedIssuer: "https://auth.example.com",
      }),
    ).toThrow("Token issuer mismatch");
  });

  it("skips issuer check when not configured", () => {
    const claims: UserInfoClaims = {
      ...baseClaims,
      iss: "https://any-issuer.example.com",
    };
    expect(() => validateClaims(claims)).not.toThrow();
  });
});

describe("isIntrospectionQuery", () => {
  it("returns true for __schema queries", () => {
    expect(isIntrospectionQuery("{ __schema { types { name } } }")).toBe(true);
  });

  it("returns true for IntrospectionQuery", () => {
    expect(isIntrospectionQuery("query IntrospectionQuery { __schema }")).toBe(
      true,
    );
  });

  it("returns false for regular queries", () => {
    expect(isIntrospectionQuery("{ users { id name } }")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isIntrospectionQuery(undefined)).toBe(false);
  });
});

describe("extractBearerToken", () => {
  it("extracts token from Bearer header", () => {
    expect(extractBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("returns undefined for null header", () => {
    expect(extractBearerToken(null)).toBeUndefined();
  });

  it("returns undefined for non-Bearer header", () => {
    expect(extractBearerToken("Basic abc123")).toBeUndefined();
  });
});

describe("createAuthQueryClient", () => {
  it("creates a QueryClient", () => {
    const qc = createAuthQueryClient();
    expect(qc).toBeDefined();
    expect(typeof qc.getQueryData).toBe("function");
  });
});

describe("createGetOrganizationClaimsFromCache", () => {
  it("returns empty array when nothing cached", () => {
    const qc = createAuthQueryClient();
    const getOrgClaims = createGetOrganizationClaimsFromCache(qc);
    expect(getOrgClaims("some-token")).toEqual([]);
  });

  it("returns cached org claims", () => {
    const qc = createAuthQueryClient();
    const orgClaims = [
      {
        id: "org-1",
        name: "Test Org",
        slug: "test-org",
        type: "personal" as const,
        roles: ["owner"],
        teams: [],
      },
    ];
    qc.setQueryData(["UserInfo", { accessToken: "test-token" }], {
      sub: "user-1",
      "https://manifold.omni.dev/@omni/claims/organizations": orgClaims,
    });

    const getOrgClaims = createGetOrganizationClaimsFromCache(qc);
    expect(getOrgClaims("test-token")).toEqual(orgClaims);
  });
});
