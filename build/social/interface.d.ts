/**
 * A user's connected social account, as read from Gatekeeper.
 */
type SocialConnectionDTO = {
    /** Platform slug, e.g. "threads" or "bluesky" */
    platform: string;
    /** Public handle on the platform, null until resolved */
    handle: string | null;
    /** Canonical profile URL, null until resolved */
    profileUrl: string | null;
    /** Avatar image URL, null until resolved */
    avatarUrl: string | null;
    /** Connection status, e.g. "connected" or "pending" */
    status: string;
    /** Whether the platform verified account ownership */
    verified: boolean;
    /** ISO timestamp of when the connection was established */
    connectedAt: string;
};
/**
 * Social connections provider interface.
 * Reads a user's connected social handles from Gatekeeper.
 */
interface SocialProvider {
    /**
     * Read all social connections for a user.
     * @param userId - The Gatekeeper user id
     * @returns The user's connections, or [] on any error (fail-open)
     */
    getConnections(userId: string): Promise<SocialConnectionDTO[]>;
    /**
     * Read a single social connection for a user by platform.
     * @param userId - The Gatekeeper user id
     * @param platform - The platform slug to filter by
     * @returns The matching connection, or null if absent or on error (fail-open)
     */
    getConnection(userId: string, platform: string): Promise<SocialConnectionDTO | null>;
}
export type { SocialConnectionDTO, SocialProvider };
