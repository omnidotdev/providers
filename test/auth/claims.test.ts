import { describe, expect, it } from "bun:test";

import { OMNI_CLAIMS_NAMESPACE, extractOrgClaims } from "../../src/auth";

import type { UserInfoClaims } from "../../src/auth";

describe("extractOrgClaims", () => {
  it("should extract organization claims from JWT payload", () => {
    const claims: UserInfoClaims = {
      sub: "user-1",
      email: "test@example.com",
      [OMNI_CLAIMS_NAMESPACE]: [
        {
          id: "org-1",
          slug: "acme",
          type: "team",
          roles: ["admin"],
          teams: [{ id: "team-1", name: "Engineering" }],
        },
      ],
    };

    const orgs = extractOrgClaims(claims);
    expect(orgs).toHaveLength(1);
    expect(orgs[0].id).toBe("org-1");
    expect(orgs[0].slug).toBe("acme");
    expect(orgs[0].roles).toContain("admin");
  });

  it("should return empty array when no org claims", () => {
    const claims: UserInfoClaims = {
      sub: "user-1",
      email: "test@example.com",
    };

    const orgs = extractOrgClaims(claims);
    expect(orgs).toEqual([]);
  });

  it("should handle multiple organizations", () => {
    const claims: UserInfoClaims = {
      sub: "user-1",
      [OMNI_CLAIMS_NAMESPACE]: [
        {
          id: "org-1",
          slug: "acme",
          type: "personal",
          roles: ["owner"],
          teams: [],
        },
        {
          id: "org-2",
          slug: "corp",
          type: "team",
          roles: ["member"],
          teams: [],
        },
      ],
    };

    const orgs = extractOrgClaims(claims);
    expect(orgs).toHaveLength(2);
  });
});
