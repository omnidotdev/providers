import type { BillingProvider, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, EntitlementsResponse, Price, Subscription } from "./interface";
/**
 * Local billing provider.
 * Returns unlimited entitlements for self-hosted mode.
 */
declare class LocalBillingProvider implements BillingProvider {
    getEntitlements(entityType: string, entityId: string, _productId?: string, _accessToken?: string): Promise<EntitlementsResponse>;
    checkEntitlement(_entityType: string, _entityId: string, _productId: string, featureKey: string, _accessToken?: string): Promise<string | null>;
    getPrices(_appName: string): Promise<Price[]>;
    createCheckoutSession(_params: CheckoutParams): Promise<string>;
    createCheckoutWithWorkspace(_params: CheckoutWithWorkspaceParams): Promise<CheckoutWithWorkspaceResponse>;
    getSubscription(_entityType: string, _entityId: string, _accessToken: string): Promise<Subscription>;
    getBillingPortalUrl(_entityType: string, _entityId: string, _productId: string, returnUrl: string, _accessToken: string): Promise<string>;
    cancelSubscription(_entityType: string, _entityId: string, _accessToken: string): Promise<string>;
    renewSubscription(_entityType: string, _entityId: string, _accessToken: string): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export { LocalBillingProvider };
