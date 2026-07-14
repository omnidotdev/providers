/** Organization management types returned by Gatekeeper */
type GatekeeperOrganization = {
    id: string;
    name: string;
    slug: string;
    /** Organization logo URL, if set */
    logo?: string | null;
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
/**
 * Result of a unified-namespace availability check (usernames + team org
 * slugs). `conflict` names what already owns the handle, when taken.
 */
type NamespaceAvailability = {
    available: boolean;
    conflict?: "username" | "organization" | null;
};
/** Error thrown by GatekeeperOrgClient methods */
declare class GatekeeperOrgError extends Error {
    status: number;
    constructor(message: string, status: number);
    get isSessionExpired(): boolean;
    get isForbidden(): boolean;
}
/** Generate a URL-safe slug from a name */
declare const slugify: (name: string) => string;
/**
 * Typed client for Better Auth organization plugin endpoints on Gatekeeper.
 * GET endpoints pass query params directly (not as serialized JSON).
 * POST endpoints use JSON body.
 *
 * Member reads and mutations use Better Auth's permission-checked organization
 * endpoints (`/organization/*`): the caller's OAuth access token is resolved to
 * a session by Gatekeeper's oidc-access-token plugin, and Better Auth enforces
 * that the caller is an appropriately-privileged member of the target org. These
 * must run server-side, since the client sets an `Origin` header (which browsers
 * forbid overriding) and Gatekeeper only trusts the IdP origin.
 *
 * `listMembersViaService` is the exception: it hits the service-only
 * `/api/organization/members` route (gated on `ORG_SYNC_SERVICE_TOKEN`) for
 * trusted server-to-server callers that act without a user session.
 */
declare class GatekeeperOrgClient {
    private baseUrl;
    constructor(baseUrl: string);
    /** Build authorization and origin headers */
    private authHeaders;
    /** Parse an error response into a GatekeeperOrgError */
    private parseError;
    /** Create an organization */
    createOrganization(params: {
        name: string;
        slug?: string;
    }, accessToken: string): Promise<GatekeeperOrganization>;
    /**
     * Check whether a workspace handle (slug) is free across the ecosystem-global
     * namespace (usernames + team org slugs). Public endpoint, no auth required,
     * so products can gate the create form before submitting.
     */
    checkNamespaceAvailability(slug: string): Promise<NamespaceAvailability>;
    /** Invite a member to an organization */
    inviteMember(params: {
        organizationId: string;
        email: string;
        role: "admin" | "member";
    }, accessToken: string): Promise<GatekeeperInvitation>;
    /** List pending invitations for an organization */
    listInvitations(organizationId: string, accessToken: string): Promise<GatekeeperInvitation[]>;
    /** Cancel a pending invitation */
    cancelInvitation(invitationId: string, accessToken: string): Promise<GatekeeperInvitation | null>;
    /** Get full organization details by slug (returns null on error) */
    getOrganizationBySlug(slug: string, accessToken: string): Promise<GatekeeperOrganization | null>;
    /** Fetch organization by slug via public API (no auth required) */
    fetchOrganizationBySlug(slug: string): Promise<GatekeeperOrganization | null>;
    /**
     * List members of an organization (user context).
     *
     * Hits Better Auth's permission-checked `list-members` endpoint; Gatekeeper
     * resolves the OAuth access token to a session and enforces that the caller is
     * a member of the org. Must run server-side (see class docs re: Origin).
     */
    listMembers(organizationId: string, accessToken: string): Promise<{
        data: GatekeeperMember[];
    }>;
    /**
     * List members using the org-sync service token (server-to-server).
     *
     * Hits Gatekeeper's service-only `/api/organization/members` route, gated on
     * `ORG_SYNC_SERVICE_TOKEN`, for trusted backend callers that act without a user
     * session (e.g. org sync). Prefer `listMembers` for user-context reads.
     */
    listMembersViaService(organizationId: string, serviceToken: string): Promise<{
        data: GatekeeperMember[];
    }>;
    /**
     * Update a member's role (user context).
     *
     * Uses Better Auth's `update-member-role` endpoint, which enforces caller
     * privileges and syncs the change to the authz plane via Gatekeeper's org
     * hooks. Must run server-side.
     */
    updateMemberRole(params: {
        organizationId: string;
        memberId: string;
        role: GatekeeperMemberRole;
    }, accessToken: string): Promise<GatekeeperMember>;
    /**
     * Remove a member from an organization (user context).
     *
     * Uses Better Auth's `remove-member` endpoint, which enforces caller
     * privileges and syncs the removal to the authz plane via Gatekeeper's org
     * hooks. Must run server-side.
     */
    removeMember(params: {
        organizationId: string;
        memberId: string;
    }, accessToken: string): Promise<void>;
}
/**
 * Check whether an invitation has expired based on its `expiresAt` timestamp.
 */
declare const isInvitationExpired: (invitation: GatekeeperInvitation) => boolean;
type InvitationValidationResult = {
    valid: true;
} | {
    valid: false;
    reason: string;
};
interface ValidateInvitationParams {
    email: string;
    pendingInvitations: GatekeeperInvitation[];
    memberEmails: string[];
}
/**
 * Validate that an invitation email doesn't conflict with existing
 * active (non-expired) pending invitations or current org members.
 */
declare const validateInvitation: ({ email, pendingInvitations, memberEmails, }: ValidateInvitationParams) => InvitationValidationResult;
type InviteTimeInfo = {
    sentAgo: string;
    expiresLabel: string;
    isExpired: boolean;
};
/**
 * Derive human-readable time info for an invitation.
 * @param invitation - Gatekeeper invitation with `createdAt` and `expiresAt`
 */
declare const getInviteTimeInfo: (invitation: GatekeeperInvitation) => InviteTimeInfo;
/**
 * Format a millisecond duration as a human-readable relative time string.
 * @param ms - Duration in milliseconds
 */
declare const formatRelativeTime: (ms: number) => string;
export { GatekeeperOrgClient, GatekeeperOrgError, formatRelativeTime, getInviteTimeInfo, isInvitationExpired, slugify, validateInvitation, };
export type { GatekeeperInvitation, GatekeeperMember, GatekeeperMemberRole, GatekeeperOrganization, InvitationValidationResult, InviteTimeInfo, NamespaceAvailability, ValidateInvitationParams, };
