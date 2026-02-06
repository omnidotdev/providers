import { describe, expect, it } from "bun:test";

import { LocalAuthzProvider } from "../../src/authz/local";

describe("LocalAuthzProvider", () => {
  const provider = new LocalAuthzProvider();

  it("should always allow permission checks", async () => {
    const result = await provider.checkPermission(
      "user-1",
      "organization",
      "org-1",
      "admin",
    );
    expect(result).toBe(true);
  });

  it("should always allow batch permission checks", async () => {
    const results = await provider.checkPermissionsBatch([
      {
        userId: "user-1",
        resourceType: "organization",
        resourceId: "org-1",
        permission: "admin",
      },
      {
        userId: "user-2",
        resourceType: "project",
        resourceId: "proj-1",
        permission: "read",
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(true);
  });

  it("should succeed on tuple writes", async () => {
    const result = await provider.writeTuples([
      { user: "user:1", relation: "admin", object: "organization:1" },
    ]);
    expect(result).toEqual({ success: true });
  });

  it("should succeed on tuple deletes", async () => {
    const result = await provider.deleteTuples([
      { user: "user:1", relation: "admin", object: "organization:1" },
    ]);
    expect(result).toEqual({ success: true });
  });

  it("should report healthy", async () => {
    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);
  });
});
