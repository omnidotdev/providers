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
declare class GatekeeperOrgError extends Error {
    status: number;
    constructor(message: string, status: number);
    get isSessionExpired(): boolean;
    get isForbidden(): boolean;
}
/**
 * Typed client for Better Auth organization plugin endpoints on Gatekeeper.
 * GET endpoints pass query params directly (not as serialized JSON).
 * POST endpoints use JSON body.
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
    /** List members of an organization */
    listMembers(organizationId: string, accessToken: string): Promise<{
        data: GatekeeperMember[];
    }>;
    /** Update a member's role */
    updateMemberRole(params: {
        organizationId: string;
        memberId: string;
        role: GatekeeperMemberRole;
    }, accessToken: string): Promise<GatekeeperMember>;
    /** Remove a member from an organization */
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
export { GatekeeperOrgClient, GatekeeperOrgError, formatRelativeTime, getInviteTimeInfo, isInvitationExpired, validateInvitation, };
export type { GatekeeperInvitation, GatekeeperMember, GatekeeperMemberRole, GatekeeperOrganization, InvitationValidationResult, InviteTimeInfo, ValidateInvitationParams, };
