import type { ApiKeyInfo, ApiKeyProvider } from "./interface";
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
declare class GatekeeperApiKeyProvider implements ApiKeyProvider {
    private readonly config;
    private readonly circuitBreaker;
    private readonly keyCache;
    constructor(config: GatekeeperApiKeyProviderConfig & {
        authBaseUrl: string;
    });
    verifyApiKey(key: string): Promise<ApiKeyInfo | null>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { GatekeeperApiKeyProvider };
export type { GatekeeperApiKeyProviderConfig };
