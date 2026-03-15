import { describe, expect, it } from "bun:test";

import { GatekeeperOrgClient, GatekeeperOrgError } from "./gatekeeperOrg";

describe("GatekeeperOrgError", () => {
  it("should preserve message and status", () => {
    const err = new GatekeeperOrgError("something broke", 500);

    expect(err.message).toBe("something broke");
    expect(err.status).toBe(500);
    expect(err.name).toBe("GatekeeperOrgError");
  });

  it("should detect session expired (401)", () => {
    const err = new GatekeeperOrgError("expired", 401);

    expect(err.isSessionExpired).toBe(true);
    expect(err.isForbidden).toBe(false);
  });

  it("should detect forbidden (403)", () => {
    const err = new GatekeeperOrgError("forbidden", 403);

    expect(err.isSessionExpired).toBe(false);
    expect(err.isForbidden).toBe(true);
  });

  it("should be an instance of Error", () => {
    const err = new GatekeeperOrgError("test", 400);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GatekeeperOrgError);
  });
});

describe("GatekeeperOrgClient", () => {
  const client = new GatekeeperOrgClient("https://auth.example.com");

  it("should store base URL", () => {
    expect(client).toBeDefined();
  });

  it("should expose createOrganization", () => {
    expect(typeof client.createOrganization).toBe("function");
  });

  it("should expose inviteMember", () => {
    expect(typeof client.inviteMember).toBe("function");
  });

  it("should expose listInvitations", () => {
    expect(typeof client.listInvitations).toBe("function");
  });

  it("should expose cancelInvitation", () => {
    expect(typeof client.cancelInvitation).toBe("function");
  });

  it("should expose getOrganizationBySlug", () => {
    expect(typeof client.getOrganizationBySlug).toBe("function");
  });

  it("should expose fetchOrganizationBySlug", () => {
    expect(typeof client.fetchOrganizationBySlug).toBe("function");
  });

  it("should expose listMembers", () => {
    expect(typeof client.listMembers).toBe("function");
  });

  it("should expose updateMemberRole", () => {
    expect(typeof client.updateMemberRole).toBe("function");
  });

  it("should expose removeMember", () => {
    expect(typeof client.removeMember).toBe("function");
  });
});
