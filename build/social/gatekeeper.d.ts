import type { SocialConnectionDTO, SocialProvider } from "./interface";
type GatekeeperSocialProviderConfig = {
    /** Gatekeeper base URL (no trailing slash) */
    baseUrl: string;
    /** Service key used for server-to-server auth */
    serviceKey: string;
    /** Request timeout in milliseconds */
    timeoutMs?: number;
};
/**
 * Gatekeeper social connections provider.
 * Reads a user's connected social handles from the Gatekeeper social API.
 *
 * Fail-open: on any network error, non-2xx, or timeout the reads degrade to
 * "no connections" (`[]` / `null`) rather than throwing, so a consumer never
 * crashes a request just because Gatekeeper is briefly unreachable.
 */
declare class GatekeeperSocialProvider implements SocialProvider {
    private readonly config;
    constructor(config: GatekeeperSocialProviderConfig);
    getConnections(userId: string): Promise<SocialConnectionDTO[]>;
    getConnection(userId: string, platform: string): Promise<SocialConnectionDTO | null>;
}
export { GatekeeperSocialProvider };
export type { GatekeeperSocialProviderConfig };
