import type { AuthzProvider, AuthzTuple, PermissionCheck, PermissionCheckResult, TupleSyncResult } from "./interface";
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
declare class WardenAuthzProvider implements AuthzProvider {
    private readonly config;
    private readonly circuitBreaker;
    private readonly permissionCache;
    constructor(config: WardenAuthzProviderConfig & {
        apiUrl: string;
    });
    checkPermission(userId: string, resourceType: string, resourceId: string, permission: string, requestCache?: Map<string, boolean>): Promise<boolean>;
    checkPermissionsBatch(checks: PermissionCheck[], requestCache?: Map<string, boolean>): Promise<PermissionCheckResult[]>;
    writeTuples(tuples: AuthzTuple[], accessToken?: string): Promise<TupleSyncResult>;
    deleteTuples(tuples: AuthzTuple[], accessToken?: string): Promise<TupleSyncResult>;
    invalidateCache(pattern: string): void;
    clearCache(): void;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
    private authHeaders;
    private syncViaVortex;
    private syncDirect;
}
export { WardenAuthzProvider };
export type { WardenAuthzProviderConfig };
