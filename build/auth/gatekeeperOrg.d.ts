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
export { GatekeeperOrgClient, GatekeeperOrgError };
export type { GatekeeperInvitation, GatekeeperMember, GatekeeperMemberRole, GatekeeperOrganization, };
