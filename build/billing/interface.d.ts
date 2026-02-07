/** Entitlement from billing service */
type Entitlement = {
    id: string;
    productId: string;
    featureKey: string;
    value: string | null;
    source: string;
    validFrom: string;
    validUntil: string | null;
};
/** Entitlements response from billing service */
type EntitlementsResponse = {
    billingAccountId: string;
    entityType: string;
    entityId: string;
    entitlementVersion: number;
    entitlements: Entitlement[];
};
/**
 * Result type for entitlements fetch.
 * Distinguishes between "service unavailable" and "no entitlements found".
 */
type EntitlementsResult = {
    status: "success";
    data: EntitlementsResponse;
} | {
    status: "not_found";
} | {
    status: "unavailable";
    error: string;
};
/** Subscription details */
type Subscription = {
    id: string;
    status: string;
    cancelAt: number | null;
    currentPeriodEnd: number;
    priceId: string;
    product: {
        id: string;
        name: string;
        description: string | null;
        marketing_features: Array<{
            name: string;
        }>;
    } | null;
};
/** Product information */
type Product = {
    id: string;
    name: string;
    description: string | null;
    marketing_features: Array<{
        name: string;
    }>;
};
/** Recurring billing details */
type Recurring = {
    interval: "day" | "week" | "month" | "year";
    interval_count: number;
    meter?: string | null;
    trial_period_days?: number | null;
    usage_type?: "licensed" | "metered";
};
/** Price with expanded product */
type Price = {
    id: string;
    active: boolean;
    currency: string;
    unit_amount: number | null;
    recurring: Recurring | null;
    product: Product;
    metadata: Record<string, string>;
};
/** Checkout session parameters */
type CheckoutParams = {
    priceId: string;
    successUrl: string;
    customerEmail: string;
    customerName?: string;
    customerId?: string;
    metadata?: Record<string, string>;
};
/**
 * Checkout with workspace parameters.
 * Either workspaceId (upgrade existing) or createWorkspace (new) must be provided.
 */
type CheckoutWithWorkspaceParams = {
    appId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    accessToken: string;
    /** Upgrade existing workspace */
    workspaceId?: string;
    /** Create new workspace */
    createWorkspace?: {
        name: string;
        slug?: string;
    };
};
/** Checkout with workspace response */
type CheckoutWithWorkspaceResponse = {
    checkoutUrl: string;
    workspaceSlug: string;
    organizationId: string;
};
/**
 * Billing provider interface.
 * Implementations check feature access and limits.
 */
interface BillingProvider {
    /**
     * Get all entitlements for an entity.
     */
    getEntitlements(entityType: string, entityId: string, productId?: string, accessToken?: string): Promise<EntitlementsResponse | null>;
    /**
     * Check if an entity has a specific entitlement.
     * @returns The entitlement value or null if not found
     */
    checkEntitlement(entityType: string, entityId: string, productId: string, featureKey: string, accessToken?: string): Promise<string | null>;
    /** Get available prices for an app */
    getPrices(appName: string): Promise<Price[]>;
    /**
     * Create a checkout session for a new subscription.
     * @deprecated Use createCheckoutWithWorkspace for new implementations
     */
    createCheckoutSession(params: CheckoutParams): Promise<string>;
    /**
     * Create a checkout session with workspace creation/selection.
     * Routes through Aether for orchestration.
     */
    createCheckoutWithWorkspace(params: CheckoutWithWorkspaceParams): Promise<CheckoutWithWorkspaceResponse>;
    /** Get subscription details for an entity */
    getSubscription(entityType: string, entityId: string, accessToken: string): Promise<Subscription | null>;
    /** Get billing portal URL for an entity */
    getBillingPortalUrl(entityType: string, entityId: string, productId: string, returnUrl: string, accessToken: string): Promise<string>;
    /** Cancel a subscription */
    cancelSubscription(entityType: string, entityId: string, accessToken: string): Promise<string>;
    /** Renew a subscription (remove scheduled cancellation) */
    renewSubscription(entityType: string, entityId: string, accessToken: string): Promise<void>;
    /** Invalidate cached entitlements for an entity */
    invalidateCache?(entityType: string, entityId: string): void;
    /** Clear all cached entitlements */
    clearCache?(): void;
    /** Health check for the provider */
    healthCheck?(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export type { BillingProvider, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, Entitlement, EntitlementsResponse, EntitlementsResult, Price, Product, Recurring, Subscription, };
