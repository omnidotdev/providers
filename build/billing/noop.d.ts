import type { BillingProvider, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, EntitlementsResponse, Price, Subscription } from "./interface";
type NoopBillingProviderConfig = Record<string, never>;
/**
 * No-op billing provider for self-hosted, dev, and testing.
 * Returns null for queries (consumers fall back to free-tier defaults).
 * Throws on write operations (checkout, portal, cancel).
 */
declare class NoopBillingProvider implements BillingProvider {
    getEntitlements(_entityType: string, _entityId: string, _productId?: string, _accessToken?: string): Promise<EntitlementsResponse | null>;
    checkEntitlement(_entityType: string, _entityId: string, _productId: string, _featureKey: string, _accessToken?: string): Promise<string | null>;
    getPrices(_appName: string): Promise<Price[]>;
    createCheckoutSession(_params: CheckoutParams): Promise<string>;
    createCheckoutWithWorkspace(_params: CheckoutWithWorkspaceParams): Promise<CheckoutWithWorkspaceResponse>;
    getSubscription(_entityType: string, _entityId: string, _accessToken: string): Promise<Subscription | null>;
    getBillingPortalUrl(_entityType: string, _entityId: string, _productId: string, _returnUrl: string, _accessToken: string): Promise<string>;
    cancelSubscription(_entityType: string, _entityId: string, _accessToken: string): Promise<string>;
    renewSubscription(_entityType: string, _entityId: string, _accessToken: string): Promise<void>;
    invalidateCache(_entityType: string, _entityId: string): void;
    clearCache(): void;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { NoopBillingProvider };
export type { NoopBillingProviderConfig };
