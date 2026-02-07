import { TtlCache } from "../util/cache";
import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type {
  AuthzProvider,
  AuthzTuple,
  PermissionCheck,
  PermissionCheckResult,
  TupleSyncResult,
} from "./interface";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Default permission cache TTL: 2 minutes */
const DEFAULT_CACHE_TTL_MS = 120_000;

type WardenAuthzProviderConfig = {
  /** Warden PDP API URL */
  apiUrl?: string;
  /** Service key for service-to-service auth */
  serviceKey?: string;
  /** Vortex workflow engine URL (optional fallback for tuple sync) */
  vortexUrl?: string;
  /** Vortex authz webhook secret */
  vortexWebhookSecret?: string;
  /** Source identifier for Vortex events (e.g., "runa", "backfeed") */
  source?: string;
  /** Permission cache TTL in milliseconds */
  cacheTtlMs?: number;
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold?: number;
  /** Circuit breaker cooldown in milliseconds */
  circuitBreakerCooldownMs?: number;
};

/**
 * Warden authorization provider.
 * Uses OpenFGA-compatible API for permission checks.
 *
 * Features:
 * - Two-layer caching (request-scoped + TTL cache)
 * - Circuit breaker (fail-closed for security)
 * - Vortex fallback for tuple writes/deletes
 * - Batch permission checks
 * - Structured JSON logging
 */
class WardenAuthzProvider implements AuthzProvider {
  private readonly config: Required<
    Pick<WardenAuthzProviderConfig, "cacheTtlMs">
  > &
    WardenAuthzProviderConfig & { apiUrl: string };
  private readonly circuitBreaker: CircuitBreaker;
  private readonly permissionCache: TtlCache<boolean>;

  constructor(config: WardenAuthzProviderConfig & { apiUrl: string }) {
    this.config = {
      ...config,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "warden-authz",
    });
    this.permissionCache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs,
    });
  }

  async checkPermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    permission: string,
    requestCache?: Map<string, boolean>,
  ): Promise<boolean> {
    const cacheKey = buildCacheKey(
      userId,
      resourceType,
      resourceId,
      permission,
    );

    // Layer 1: Request-scoped cache
    if (requestCache?.has(cacheKey)) {
      return requestCache.get(cacheKey)!;
    }

    // Layer 2: TTL cache
    const cached = this.permissionCache.get(cacheKey);
    if (cached !== null) {
      requestCache?.set(cacheKey, cached);
      return cached;
    }

    const startTime = Date.now();

    try {
      const allowed = await this.circuitBreaker.execute(async () => {
        const response = await fetch(`${this.config.apiUrl}/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.authHeaders(),
          },
          body: JSON.stringify({
            user: `user:${userId}`,
            relation: permission,
            object: `${resourceType}:${resourceId}`,
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
          throw new Error(`AuthZ check failed: ${response.status}`);
        }

        const result = (await response.json()) as { allowed: boolean };
        return result.allowed;
      });

      // Store in both caches
      requestCache?.set(cacheKey, allowed);
      this.permissionCache.set(cacheKey, allowed);

      log("info", "authz", "permission check", {
        userId,
        resourceType,
        resourceId,
        permission,
        allowed,
        durationMs: Date.now() - startTime,
      });

      return allowed;
    } catch (err) {
      log("error", "authz", "permission check failed", {
        userId,
        resourceType,
        resourceId,
        permission,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      // Fail-closed: deny access when PDP is unavailable
      throw err;
    }
  }

  async checkPermissionsBatch(
    checks: PermissionCheck[],
    requestCache?: Map<string, boolean>,
  ): Promise<PermissionCheckResult[]> {
    const results: PermissionCheckResult[] = [];
    const uncachedChecks: Array<{
      index: number;
      check: PermissionCheck;
    }> = [];

    // Check caches first
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      const cacheKey = buildCacheKey(
        check.userId,
        check.resourceType,
        check.resourceId,
        check.permission,
      );

      // Layer 1: Request-scoped cache
      if (requestCache?.has(cacheKey)) {
        results[i] = { ...check, allowed: requestCache.get(cacheKey)! };
        continue;
      }

      // Layer 2: TTL cache
      const cached = this.permissionCache.get(cacheKey);
      if (cached !== null) {
        requestCache?.set(cacheKey, cached);
        results[i] = { ...check, allowed: cached };
        continue;
      }

      uncachedChecks.push({ index: i, check });
    }

    if (uncachedChecks.length === 0) return results;

    const startTime = Date.now();

    try {
      const batchResults = await this.circuitBreaker.execute(async () => {
        const response = await fetch(`${this.config.apiUrl}/check/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.authHeaders(),
          },
          body: JSON.stringify({
            checks: uncachedChecks.map(({ check }) => ({
              user: `user:${check.userId}`,
              relation: check.permission,
              object: `${check.resourceType}:${check.resourceId}`,
            })),
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
          throw new Error(`AuthZ batch check failed: ${response.status}`);
        }

        const result = (await response.json()) as {
          results: Array<{ allowed: boolean }>;
        };
        return result.results;
      });

      for (let i = 0; i < uncachedChecks.length; i++) {
        const { index, check } = uncachedChecks[i];
        const allowed = batchResults[i].allowed;
        const cacheKey = buildCacheKey(
          check.userId,
          check.resourceType,
          check.resourceId,
          check.permission,
        );

        requestCache?.set(cacheKey, allowed);
        this.permissionCache.set(cacheKey, allowed);
        results[index] = { ...check, allowed };
      }

      log("info", "authz", "batch permission check", {
        total: checks.length,
        fetched: uncachedChecks.length,
        durationMs: Date.now() - startTime,
      });

      return results;
    } catch (err) {
      log("error", "authz", "batch permission check failed", {
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async writeTuples(
    tuples: AuthzTuple[],
    accessToken?: string,
  ): Promise<TupleSyncResult> {
    if (tuples.length === 0) return { success: true };

    // Try Vortex first if configured
    if (this.config.vortexUrl && this.config.vortexWebhookSecret) {
      const result = await this.syncViaVortex("write", tuples);
      if (result.success) return result;
      // Fall through to direct API
    }

    return this.syncDirect("POST", tuples, accessToken);
  }

  async deleteTuples(
    tuples: AuthzTuple[],
    accessToken?: string,
  ): Promise<TupleSyncResult> {
    if (tuples.length === 0) return { success: true };

    // Try Vortex first if configured
    if (this.config.vortexUrl && this.config.vortexWebhookSecret) {
      const result = await this.syncViaVortex("delete", tuples);
      if (result.success) return result;
    }

    return this.syncDirect("DELETE", tuples, accessToken);
  }

  invalidateCache(pattern: string): void {
    this.permissionCache.invalidate(pattern);
  }

  clearCache(): void {
    this.permissionCache.clear();
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
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

  private authHeaders(): Record<string, string> {
    if (this.config.serviceKey) {
      return { "X-Service-Key": this.config.serviceKey };
    }
    return {};
  }

  private async syncViaVortex(
    operation: "write" | "delete",
    tuples: AuthzTuple[],
  ): Promise<TupleSyncResult> {
    try {
      const response = await fetch(
        `${this.config.vortexUrl}/webhooks/authz/${this.config.vortexWebhookSecret}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Event-Type": `authz.tuples.${operation}`,
          },
          body: JSON.stringify({
            tuples,
            timestamp: new Date().toISOString(),
            source: this.config.source ?? "unknown",
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );

      if (response.ok) {
        log("info", "authz", `tuple ${operation} via Vortex`, {
          tupleCount: tuples.length,
        });
        return { success: true };
      }

      log("warn", "authz", `Vortex ${operation} failed, falling back`, {
        status: response.status,
        tupleCount: tuples.length,
      });
      return {
        success: false,
        error: `Vortex returned ${response.status}`,
      };
    } catch (error) {
      log("warn", "authz", `Vortex ${operation} error, falling back`, {
        error: error instanceof Error ? error.message : String(error),
        tupleCount: tuples.length,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async syncDirect(
    method: "POST" | "DELETE",
    tuples: AuthzTuple[],
    accessToken?: string,
  ): Promise<TupleSyncResult> {
    const operation = method === "POST" ? "write" : "delete";

    if (!this.config.serviceKey && !accessToken) {
      const errorMsg =
        "No service key or access token for Warden API authentication";
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length,
      });
      return { success: false, error: errorMsg };
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.serviceKey) {
        headers["X-Service-Key"] = this.config.serviceKey;
      } else if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${this.config.apiUrl}/tuples`, {
        method,
        headers,
        body: JSON.stringify({ tuples }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        log("info", "authz", `tuple ${operation}`, {
          tupleCount: tuples.length,
        });
        return { success: true };
      }

      const errorMsg = `Warden API returned ${response.status}`;
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length,
      });
      return { success: false, error: errorMsg };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length,
      });
      return { success: false, error: errorMsg };
    }
  }
}

function buildCacheKey(
  userId: string,
  resourceType: string,
  resourceId: string,
  permission: string,
): string {
  return `${userId}:${resourceType}:${resourceId}:${permission}`;
}

export { WardenAuthzProvider };

export type { WardenAuthzProviderConfig };
