import type { BillingProvider, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, EntitlementsResponse, Price, Subscription } from "./interface";
type AetherBillingProviderConfig = {
    /** Aether billing service base URL */
    baseUrl?: string;
    /** Service API key for service-to-service auth */
    serviceApiKey?: string;
    /** Product identifier (e.g., "runa", "backfeed") */
    appId?: string;
    /** Cache TTL in milliseconds */
    cacheTtlMs?: number;
    /** Circuit breaker failure threshold */
    circuitBreakerThreshold?: number;
    /** Circuit breaker cooldown in milliseconds */
    circuitBreakerCooldownMs?: number;
};
/**
 * Aether billing provider.
 * Fetches entitlements from Aether billing service.
 *
 * Features:
 * - Circuit breaker to prevent thundering herd
 * - TTL cache for entitlements
 * - Service API key authentication
 * - Structured JSON logging
 */
type ValidatedAetherConfig = AetherBillingProviderConfig & {
    baseUrl: string;
    appId: string;
};
declare class AetherBillingProvider implements BillingProvider {
    private readonly config;
    private readonly circuitBreaker;
    private readonly cache;
    constructor(config: ValidatedAetherConfig);
    getEntitlements(entityType: string, entityId: string, productId?: string, accessToken?: string): Promise<EntitlementsResponse | null>;
    checkEntitlement(entityType: string, entityId: string, productId: string, featureKey: string, accessToken?: string): Promise<string | null>;
    getPrices(appName: string): Promise<Price[]>;
    createCheckoutSession(params: CheckoutParams): Promise<string>;
    createCheckoutWithWorkspace(params: CheckoutWithWorkspaceParams): Promise<CheckoutWithWorkspaceResponse>;
    getSubscription(entityType: string, entityId: string, accessToken: string): Promise<Subscription | null>;
    getBillingPortalUrl(entityType: string, entityId: string, productId: string, returnUrl: string, accessToken: string): Promise<string>;
    cancelSubscription(entityType: string, entityId: string, accessToken: string): Promise<string>;
    renewSubscription(entityType: string, entityId: string, accessToken: string): Promise<void>;
    invalidateCache(entityType: string, entityId: string): void;
    clearCache(): void;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
    private serviceHeaders;
}
export { AetherBillingProvider };
export type { AetherBillingProviderConfig };
