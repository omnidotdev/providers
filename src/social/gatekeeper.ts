import { log } from "../util/log";

import type { SocialConnectionDTO, SocialProvider } from "./interface";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

type GatekeeperSocialProviderConfig = {
  /** Gatekeeper base URL (no trailing slash) */
  baseUrl: string;
  /** Service key used for server-to-server auth */
  serviceKey: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
};

/**
 * Raw read response shape from Gatekeeper. The endpoint returns either a bare
 * array or an object wrapping the array under `connections`, so accept both.
 */
type GatekeeperConnectionsResponse =
  | SocialConnectionDTO[]
  | { connections?: SocialConnectionDTO[] };

/**
 * Gatekeeper social connections provider.
 * Reads a user's connected social handles from the Gatekeeper social API.
 *
 * Fail-open: on any network error, non-2xx, or timeout the reads degrade to
 * "no connections" (`[]` / `null`) rather than throwing, so a consumer never
 * crashes a request just because Gatekeeper is briefly unreachable.
 */
class GatekeeperSocialProvider implements SocialProvider {
  private readonly config: Required<GatekeeperSocialProviderConfig>;

  constructor(config: GatekeeperSocialProviderConfig) {
    this.config = {
      ...config,
      timeoutMs: config.timeoutMs ?? REQUEST_TIMEOUT_MS,
    };
  }

  async getConnections(userId: string): Promise<SocialConnectionDTO[]> {
    try {
      const url = `${this.config.baseUrl}/social/connections/read?userId=${encodeURIComponent(userId)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.serviceKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`social connections read failed: ${response.status}`);
      }

      const raw = (await response.json()) as GatekeeperConnectionsResponse;

      return Array.isArray(raw) ? raw : (raw.connections ?? []);
    } catch (error) {
      // Fail-open: degrade to "no connections" rather than throwing
      log("error", "social", "connections read failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      return [];
    }
  }

  async getConnection(
    userId: string,
    platform: string,
  ): Promise<SocialConnectionDTO | null> {
    // Gatekeeper has no per-platform read endpoint, so fetch all and filter
    const connections = await this.getConnections(userId);

    return connections.find((c) => c.platform === platform) ?? null;
  }
}

export { GatekeeperSocialProvider };

export type { GatekeeperSocialProviderConfig };
