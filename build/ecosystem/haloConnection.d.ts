export interface HaloProduct {
    productId: string;
    title: string;
    active: boolean;
    storeDomain?: string;
}
export interface HaloBuyInput {
    productId: string;
    quantity: number;
    email?: string;
    successUrl: string;
    cancelUrl: string;
}
/** Minimal GraphQL transport: run a query with variables, return typed data */
export type GraphqlRequest = <T>(query: string, variables: Record<string, unknown>) => Promise<T>;
export interface HaloConfig {
    apiUrl?: string;
    serviceKey?: string;
    storefrontBase: string;
    request?: GraphqlRequest;
}
export interface HaloConnection {
    configured: boolean;
    readProduct(productId: string): Promise<HaloProduct | null>;
    createBuyCheckout(input: HaloBuyInput): Promise<{
        url: string;
    } | null>;
    linkOut(storeDomain?: string): string;
}
/**
 * Halo (commerce) connection over its service-key GraphQL API. `product` reads
 * are public only when status is "active"; `quickBuyCheckout` is Halo's
 * documented external-surface buy mutation. Fail-soft throughout.
 */
export declare const createHaloConnection: (config: HaloConfig) => HaloConnection;
