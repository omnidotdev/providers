import { describe, expect, it } from "bun:test";

import {
  GatekeeperOrgClient,
  GatekeeperOrgError,
  formatRelativeTime,
  getInviteTimeInfo,
  isInvitationExpired,
  validateInvitation,
} from "./gatekeeperOrg";

import type { GatekeeperInvitation } from "./gatekeeperOrg";

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

const makeInvitation = (
  email: string,
  overrides?: Partial<GatekeeperInvitation>,
): GatekeeperInvitation => ({
  id: crypto.randomUUID(),
  email,
  role: "member",
  status: "pending",
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  inviterId: crypto.randomUUID(),
  organizationId: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("isInvitationExpired", () => {
  it("returns false for future expiresAt", () => {
    const inv = makeInvitation("a@b.com");
    expect(isInvitationExpired(inv)).toBe(false);
  });

  it("returns true for past expiresAt", () => {
    const inv = makeInvitation("a@b.com", {
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(isInvitationExpired(inv)).toBe(true);
  });
});

describe("validateInvitation", () => {
  it("rejects email with an active pending invitation", () => {
    const result = validateInvitation({
      email: "alice@example.com",
      pendingInvitations: [makeInvitation("alice@example.com")],
      memberEmails: [],
    });
    expect(result).toEqual({
      valid: false,
      reason: "An invitation is already pending for this email",
    });
  });

  it("rejects case-insensitively", () => {
    const result = validateInvitation({
      email: "alice@example.com",
      pendingInvitations: [makeInvitation("Alice@Example.com")],
      memberEmails: [],
    });
    expect(result).toEqual({
      valid: false,
      reason: "An invitation is already pending for this email",
    });
  });

  it("allows re-invite when pending invitation has expired", () => {
    const result = validateInvitation({
      email: "alice@example.com",
      pendingInvitations: [
        makeInvitation("alice@example.com", {
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        }),
      ],
      memberEmails: [],
    });
    expect(result).toEqual({ valid: true });
  });

  it("ignores non-pending invitations", () => {
    const result = validateInvitation({
      email: "alice@example.com",
      pendingInvitations: [
        makeInvitation("alice@example.com", { status: "cancelled" }),
      ],
      memberEmails: [],
    });
    expect(result).toEqual({ valid: true });
  });

  it("rejects email that is already an org member", () => {
    const result = validateInvitation({
      email: "bob@example.com",
      pendingInvitations: [],
      memberEmails: ["bob@example.com"],
    });
    expect(result).toEqual({
      valid: false,
      reason: "This email is already a member of the organization",
    });
  });

  it("accepts email with no conflicts", () => {
    const result = validateInvitation({
      email: "new@example.com",
      pendingInvitations: [makeInvitation("other@example.com")],
      memberEmails: ["existing@example.com"],
    });
    expect(result).toEqual({ valid: true });
  });
});

describe("formatRelativeTime", () => {
  it("should return days for durations >= 24h", () => {
    expect(formatRelativeTime(3 * 86_400_000)).toBe("3d");
  });

  it("should return hours for durations >= 1h", () => {
    expect(formatRelativeTime(5 * 3_600_000)).toBe("5h");
  });

  it("should return minutes for durations >= 1m", () => {
    expect(formatRelativeTime(45 * 60_000)).toBe("45m");
  });

  it("should return 'just now' for durations < 1m", () => {
    expect(formatRelativeTime(30_000)).toBe("just now");
    expect(formatRelativeTime(0)).toBe("just now");
  });
});

describe("getInviteTimeInfo", () => {
  it("should return isExpired=false for an active invitation", () => {
    const invitation = makeInvitation("active@example.com", {
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    const info = getInviteTimeInfo(invitation);

    expect(info.isExpired).toBe(false);
    expect(info.expiresLabel).toStartWith("Expires in");
    expect(info.sentAgo).toBe("1h");
  });

  it("should return isExpired=true for an expired invitation", () => {
    const invitation = makeInvitation("expired@example.com", {
      createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
      expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
    });
    const info = getInviteTimeInfo(invitation);

    expect(info.isExpired).toBe(true);
    expect(info.expiresLabel).toStartWith("Expired");
  });

  it("should format sentAgo relative to creation time", () => {
    const invitation = makeInvitation("old@example.com", {
      createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    });
    const info = getInviteTimeInfo(invitation);

    expect(info.sentAgo).toBe("3d");
  });
});
