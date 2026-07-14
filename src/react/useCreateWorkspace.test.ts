import { describe, expect, it, mock } from "bun:test";

import { createWorkspaceFlow } from "./useCreateWorkspace";

/** Minimal org shape returned by a transport */
const org = { id: "org_1", name: "Acme", slug: "acme", type: "team" as const };

describe("createWorkspaceFlow", () => {
  it("checks availability, creates, refreshes session, and returns the org", async () => {
    const calls: string[] = [];
    const checkAvailability = mock(async () => {
      calls.push("check");
      return { available: true, conflict: null };
    });
    const createWorkspace = mock(async () => {
      calls.push("create");
      return org;
    });
    const refreshSession = mock(async () => {
      calls.push("refresh");
    });

    const result = await createWorkspaceFlow({
      name: "Acme",
      slug: "acme",
      checkAvailability,
      createWorkspace,
      refreshSession,
    });

    expect(result).toEqual(org);
    // ordering matters: availability gate, then create, then refresh so the new
    // org lands in the JWT claims
    expect(calls).toEqual(["check", "create", "refresh"]);
    expect(checkAvailability).toHaveBeenCalledWith("acme");
    expect(createWorkspace).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
    });
  });

  it("derives a slug from the name when none is provided", async () => {
    const checkAvailability = mock(async () => ({
      available: true,
      conflict: null,
    }));
    const createWorkspace = mock(async () => org);

    await createWorkspaceFlow({
      name: "Acme & Co!",
      checkAvailability,
      createWorkspace,
    });

    expect(checkAvailability).toHaveBeenCalledWith("acme-and-co");
    expect(createWorkspace).toHaveBeenCalledWith({
      name: "Acme & Co!",
      slug: "acme-and-co",
    });
  });

  it("throws before creating when the slug is unavailable", async () => {
    const createWorkspace = mock(async () => org);

    await expect(
      createWorkspaceFlow({
        name: "Acme",
        slug: "acme",
        checkAvailability: async () => ({
          available: false,
          conflict: "organization",
        }),
        createWorkspace,
      }),
    ).rejects.toThrow(/not available/i);

    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it("skips the availability gate when no checker is provided", async () => {
    const createWorkspace = mock(async () => org);

    const result = await createWorkspaceFlow({
      name: "Acme",
      slug: "acme",
      createWorkspace,
    });

    expect(result).toEqual(org);
    expect(createWorkspace).toHaveBeenCalledTimes(1);
  });

  it("still returns the org when session refresh fails (creation already succeeded)", async () => {
    const createWorkspace = mock(async () => org);
    const refreshSession = mock(async () => {
      throw new Error("refresh boom");
    });

    const result = await createWorkspaceFlow({
      name: "Acme",
      slug: "acme",
      createWorkspace,
      refreshSession,
    });

    expect(result).toEqual(org);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("propagates transport errors from createWorkspace", async () => {
    await expect(
      createWorkspaceFlow({
        name: "Acme",
        slug: "acme",
        createWorkspace: async () => {
          throw new Error("Failed to create organization");
        },
      }),
    ).rejects.toThrow(/failed to create organization/i);
  });
});
