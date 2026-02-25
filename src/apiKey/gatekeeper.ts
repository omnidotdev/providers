import { TtlCache } from "../util/cache";
import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type { ApiKeyInfo, ApiKeyProvider } from "./interface";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Default verified key cache TTL: 2 minutes */
const DEFAULT_CACHE_TTL_MS = 120_000;

type GatekeeperApiKeyProviderConfig = {
  /** Gatekeeper auth base URL */
  authBaseUrl?: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Verified key cache TTL in milliseconds */
  cacheTtlMs?: number;
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold?: number;
  /** Circuit breaker cooldown in milliseconds */
  circuitBreakerCooldownMs?: number;
};

/** Raw response shape from the Gatekeeper API */
type GatekeeperVerifyResponse = {
  id: string;
  name: string;
  userId: string;
  metadata?: string;
};

/**
 * Gatekeeper API key verification provider.
 * Verifies API keys against the Gatekeeper auth service.
 *
 * Features:
 * - TTL cache for verified keys
 * - Circuit breaker for resilience
 * - Fail-safe: returns null on error (no identity = deny)
 * - Structured JSON logging
 */
class GatekeeperApiKeyProvider implements ApiKeyProvider {
  private readonly config: Required<
    Pick<GatekeeperApiKeyProviderConfig, "cacheTtlMs" | "timeoutMs">
  > &
    GatekeeperApiKeyProviderConfig & { authBaseUrl: string };
  private readonly circuitBreaker: CircuitBreaker;
  private readonly keyCache: TtlCache<ApiKeyInfo>;

  constructor(
    config: GatekeeperApiKeyProviderConfig & { authBaseUrl: string },
  ) {
    this.config = {
      ...config,
      timeoutMs: config.timeoutMs ?? REQUEST_TIMEOUT_MS,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "gatekeeper-api-key",
    });
    this.keyCache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs,
    });
  }

  async verifyApiKey(key: string): Promise<ApiKeyInfo | null> {
    // Check cache first
    const cached = this.keyCache.get(key);
    if (cached !== null) {
      return cached;
    }

    const startTime = Date.now();

    try {
      const info = await this.circuitBreaker.execute(async () => {
        const response = await fetch(
          `${this.config.authBaseUrl}/api-key/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
            signal: AbortSignal.timeout(this.config.timeoutMs),
          },
        );

        if (!response.ok) {
          throw new Error(`API key verification failed: ${response.status}`);
        }

        const raw = (await response.json()) as GatekeeperVerifyResponse;

        // Parse metadata JSON string and extract organizationId
        let parsedMetadata: Record<string, unknown> | undefined;

        if (raw.metadata) {
          try {
            parsedMetadata = JSON.parse(raw.metadata) as Record<
              string,
              unknown
            >;
          } catch {
            log("warn", "api-key", "failed to parse metadata JSON", {
              keyId: raw.id,
            });
          }
        }

        const orgId = parsedMetadata?.organizationId;

        const result: ApiKeyInfo = {
          id: raw.id,
          name: raw.name,
          userId: raw.userId,
          organizationId: typeof orgId === "string" ? orgId : "",
          metadata: parsedMetadata,
        };

        return result;
      });

      // Cache verified key
      this.keyCache.set(key, info);

      log("info", "api-key", "key verified", {
        keyId: info.id,
        userId: info.userId,
        durationMs: Date.now() - startTime,
      });

      return info;
    } catch (err) {
      log("error", "api-key", "key verification failed", {
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });

      // Fail-safe: return null on error (no identity = deny)
      return null;
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.authBaseUrl}/health`, {
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      return {
        healthy: response.ok,
        message: response.ok ? "OK" : `Status ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export { GatekeeperApiKeyProvider };

export type { GatekeeperApiKeyProviderConfig };
