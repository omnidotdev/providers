import type { AccountCredit, BillingProvider, ChargeReversalResult, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, CreditAddResult, CreditAddType, CreditBalance, CreditCheck, CreditDeductResult, CreditWriteOptions, EntitlementsResponse, EntitlementsResult, PortalFlow, Price, Subscription } from "./interface";
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
    /**
     * Like {@link getEntitlements} but distinguishes the three outcomes a caller
     * needs to fail closed safely:
     *  - `success`: entitlements resolved (the tenant's real tier).
     *  - `not_found`: a 404 - the entity has no billing account (legitimately on
     *    the free tier); NOT an error.
     *  - `unavailable`: Aether is unreachable / erroring (circuit open, non-2xx,
     *    or a thrown request). The caller decides whether to fail open or closed.
     */
    getEntitlementsResult(entityType: string, entityId: string, productId?: string, _accessToken?: string): Promise<EntitlementsResult>;
    checkEntitlement(entityType: string, entityId: string, productId: string, featureKey: string, accessToken?: string): Promise<string | null>;
    getPrices(appName: string): Promise<Price[]>;
    createCheckoutSession(params: CheckoutParams): Promise<string>;
    createCheckoutWithWorkspace(params: CheckoutWithWorkspaceParams): Promise<CheckoutWithWorkspaceResponse>;
    getSubscription(entityType: string, entityId: string, accessToken: string): Promise<Subscription | null>;
    listSubscriptions(entityType: string, entityId: string, accessToken: string): Promise<Subscription[]>;
    getBillingPortalUrl(entityType: string, entityId: string, productId: string, returnUrl: string, accessToken: string, flow?: PortalFlow): Promise<string>;
    cancelSubscription(entityType: string, entityId: string, accessToken: string): Promise<string>;
    renewSubscription(entityType: string, entityId: string, accessToken: string): Promise<void>;
    invalidateCache(entityType: string, entityId: string): void;
    clearCache(): void;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
    getCreditBalance(entityType: string, entityId: string): Promise<CreditBalance | null>;
    getAccountCredit(entityType: string, entityId: string, accessToken: string): Promise<AccountCredit | null>;
    checkCredits(entityType: string, entityId: string, amount: number): Promise<CreditCheck>;
    deductCredits(entityType: string, entityId: string, amount: number, options?: CreditWriteOptions): Promise<CreditDeductResult>;
    addCredits(entityType: string, entityId: string, amount: number, type: CreditAddType, options?: CreditWriteOptions): Promise<CreditAddResult | null>;
    reverseCharge(entityType: string, entityId: string, chargeId: string, options?: {
        reason?: string;
    }): Promise<ChargeReversalResult>;
    /**
     * Headers for a call made for a signed-in user (checkout, subscription
     * lookup, billing portal). Sends the service key WITH the user's token: the
     * user's token is minted for this product's own API (or is opaque), never
     * for Aether, so Aether accepts it only when the product's service key
     * vouches for the call, and still checks the user's own access per billing
     * entity. Without a configured key the token is sent alone, which Aether
     * accepts only when it was minted for Aether itself
     */
    private userHeaders;
    private serviceHeaders;
    /**
     * Fetch a read endpoint with a per-attempt timeout and retries on transient
     * failures (timeout, network error, or 5xx). Definitive responses (2xx-4xx)
     * return immediately so callers can handle 404/403 as they do today. Only use
     * for idempotent reads; write operations must not be retried.
     */
    private resilientFetch;
    private backoff;
}
export type { AetherBillingProviderConfig };
export { AetherBillingProvider };
