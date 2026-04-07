/** Organization management types returned by Gatekeeper */
type GatekeeperOrganization = {
  id: string;
  name: string;
  slug: string;
  type: "personal" | "team";
  createdAt: string;
};

type GatekeeperMember = {
  id: string;
  userId: string;
  organizationId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type GatekeeperInvitation = {
  id: string;
  email: string;
  role: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  expiresAt: string;
  inviterId: string;
  organizationId: string;
  createdAt: string;
};

type GatekeeperMemberRole = "owner" | "admin" | "member";

/** Error thrown by GatekeeperOrgClient methods */
class GatekeeperOrgError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GatekeeperOrgError";
    this.status = status;
  }

  get isSessionExpired() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}

/** Generate a URL-safe slug from a name */
const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

/**
 * Typed client for Better Auth organization plugin endpoints on Gatekeeper.
 * GET endpoints pass query params directly (not as serialized JSON).
 * POST endpoints use JSON body.
 */
class GatekeeperOrgClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Build authorization and origin headers */
  private authHeaders(
    accessToken: string,
    json?: boolean,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Origin: this.baseUrl,
    };

    if (json) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  /** Parse an error response into a GatekeeperOrgError */
  private async parseError(
    response: Response,
    fallback: string,
  ): Promise<GatekeeperOrgError> {
    if (response.status === 401) {
      return new GatekeeperOrgError(
        "Session expired. Please sign out and sign back in to re-authenticate.",
        401,
      );
    }

    try {
      const body = (await response.json()) as { message?: string };

      return new GatekeeperOrgError(body.message || fallback, response.status);
    } catch {
      return new GatekeeperOrgError(fallback, response.status);
    }
  }

  /** Create an organization */
  async createOrganization(
    params: { name: string; slug?: string },
    accessToken: string,
  ): Promise<GatekeeperOrganization> {
    const slug = params.slug || slugify(params.name);

    const response = await fetch(`${this.baseUrl}/organization/create`, {
      method: "POST",
      headers: this.authHeaders(accessToken, true),
      body: JSON.stringify({ name: params.name, slug }),
    });

    if (!response.ok) {
      throw await this.parseError(response, "Failed to create organization");
    }

    return response.json() as Promise<GatekeeperOrganization>;
  }

  /** Invite a member to an organization */
  async inviteMember(
    params: { organizationId: string; email: string; role: "admin" | "member" },
    accessToken: string,
  ): Promise<GatekeeperInvitation> {
    const response = await fetch(`${this.baseUrl}/organization/invite-member`, {
      method: "POST",
      headers: this.authHeaders(accessToken, true),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw await this.parseError(response, "Failed to invite member");
    }

    return response.json() as Promise<GatekeeperInvitation>;
  }

  /** List pending invitations for an organization */
  async listInvitations(
    organizationId: string,
    accessToken: string,
  ): Promise<GatekeeperInvitation[]> {
    const url = new URL(`${this.baseUrl}/organization/list-invitations`);
    url.searchParams.set("organizationId", organizationId);

    const response = await fetch(url.toString(), {
      headers: this.authHeaders(accessToken),
    });

    if (!response.ok) {
      throw await this.parseError(response, "Failed to list invitations");
    }

    return response.json() as Promise<GatekeeperInvitation[]>;
  }

  /** Cancel a pending invitation */
  async cancelInvitation(
    invitationId: string,
    accessToken: string,
  ): Promise<GatekeeperInvitation | null> {
    const response = await fetch(
      `${this.baseUrl}/organization/cancel-invitation`,
      {
        method: "POST",
        headers: this.authHeaders(accessToken, true),
        body: JSON.stringify({ invitationId }),
      },
    );

    if (!response.ok) {
      throw await this.parseError(response, "Failed to cancel invitation");
    }

    return response.json() as Promise<GatekeeperInvitation | null>;
  }

  /** Get full organization details by slug (returns null on error) */
  async getOrganizationBySlug(
    slug: string,
    accessToken: string,
  ): Promise<GatekeeperOrganization | null> {
    const url = new URL(`${this.baseUrl}/organization/get-full-organization`);
    url.searchParams.set("organizationSlug", slug);

    try {
      const response = await fetch(url.toString(), {
        headers: this.authHeaders(accessToken),
      });

      if (!response.ok) {
        return null;
      }

      return response.json() as Promise<GatekeeperOrganization>;
    } catch {
      return null;
    }
  }

  /** Fetch organization by slug via public API (no auth required) */
  async fetchOrganizationBySlug(
    slug: string,
  ): Promise<GatekeeperOrganization | null> {
    const response = await fetch(
      `${this.baseUrl}/api/organization/by-slug/${encodeURIComponent(slug)}`,
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await this.parseError(
        response,
        "Failed to fetch organization by slug",
      );
    }

    return response.json() as Promise<GatekeeperOrganization>;
  }

  /** List members of an organization */
  async listMembers(
    organizationId: string,
    accessToken: string,
  ): Promise<{ data: GatekeeperMember[] }> {
    const url = new URL(`${this.baseUrl}/api/organization/members`);
    url.searchParams.set("orgId", organizationId);

    const response = await fetch(url.toString(), {
      headers: this.authHeaders(accessToken),
    });

    if (!response.ok) {
      throw await this.parseError(response, "Failed to list members");
    }

    return response.json() as Promise<{ data: GatekeeperMember[] }>;
  }

  /** Update a member's role */
  async updateMemberRole(
    params: {
      organizationId: string;
      memberId: string;
      role: GatekeeperMemberRole;
    },
    accessToken: string,
  ): Promise<GatekeeperMember> {
    const url = new URL(`${this.baseUrl}/api/organization/members`);
    url.searchParams.set("orgId", params.organizationId);
    url.searchParams.set("memberId", params.memberId);

    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers: this.authHeaders(accessToken, true),
      body: JSON.stringify({ role: params.role }),
    });

    if (!response.ok) {
      throw await this.parseError(response, "Failed to update member role");
    }

    return response.json() as Promise<GatekeeperMember>;
  }

  /** Remove a member from an organization */
  async removeMember(
    params: { organizationId: string; memberId: string },
    accessToken: string,
  ): Promise<void> {
    const url = new URL(`${this.baseUrl}/api/organization/members`);
    url.searchParams.set("orgId", params.organizationId);
    url.searchParams.set("memberId", params.memberId);

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: this.authHeaders(accessToken),
    });

    if (!response.ok) {
      throw await this.parseError(response, "Failed to remove member");
    }
  }
}

/**
 * Check whether an invitation has expired based on its `expiresAt` timestamp.
 */
const isInvitationExpired = (invitation: GatekeeperInvitation): boolean =>
  new Date(invitation.expiresAt) < new Date();

type InvitationValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

interface ValidateInvitationParams {
  email: string;
  pendingInvitations: GatekeeperInvitation[];
  memberEmails: string[];
}

/**
 * Validate that an invitation email doesn't conflict with existing
 * active (non-expired) pending invitations or current org members.
 */
const validateInvitation = ({
  email,
  pendingInvitations,
  memberEmails,
}: ValidateInvitationParams): InvitationValidationResult => {
  const normalizedEmail = email.toLowerCase();

  const hasActivePendingInvite = pendingInvitations.some(
    (inv) =>
      inv.status === "pending" &&
      !isInvitationExpired(inv) &&
      inv.email.toLowerCase() === normalizedEmail,
  );

  if (hasActivePendingInvite) {
    return {
      valid: false,
      reason: "An invitation is already pending for this email",
    };
  }

  const isExistingMember = memberEmails.some(
    (memberEmail) => memberEmail.toLowerCase() === normalizedEmail,
  );

  if (isExistingMember) {
    return {
      valid: false,
      reason: "This email is already a member of the organization",
    };
  }

  return { valid: true };
};

type InviteTimeInfo = {
  sentAgo: string;
  expiresLabel: string;
  isExpired: boolean;
};

/**
 * Derive human-readable time info for an invitation.
 * @param invitation - Gatekeeper invitation with `createdAt` and `expiresAt`
 */
const getInviteTimeInfo = (invitation: GatekeeperInvitation): InviteTimeInfo => {
  const now = Date.now();
  const created = new Date(invitation.createdAt).getTime();
  const expires = new Date(invitation.expiresAt).getTime();
  const expired = expires < now;

  return {
    sentAgo: formatRelativeTime(now - created),
    expiresLabel: expired
      ? `Expired ${formatRelativeTime(now - expires)} ago`
      : `Expires in ${formatRelativeTime(expires - now)}`,
    isExpired: expired,
  };
};

/**
 * Format a millisecond duration as a human-readable relative time string.
 * @param ms - Duration in milliseconds
 */
const formatRelativeTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "just now";
};

export {
  GatekeeperOrgClient,
  GatekeeperOrgError,
  formatRelativeTime,
  getInviteTimeInfo,
  isInvitationExpired,
  validateInvitation,
};

export type {
  GatekeeperInvitation,
  GatekeeperMember,
  GatekeeperMemberRole,
  GatekeeperOrganization,
  InvitationValidationResult,
  InviteTimeInfo,
  ValidateInvitationParams,
};
