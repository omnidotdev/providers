import type { AetherBillingProviderConfig } from "./aether";
import type { BillingProvider } from "./interface";
type BillingProviderConfig = AetherBillingProviderConfig;
/**
 * Create a billing provider.
 * @param config - Provider configuration
 * @returns Configured billing provider instance
 * @throws When required config is missing
 */
declare const createBillingProvider: (config: BillingProviderConfig) => BillingProvider;
export { createBillingProvider };
export { AetherBillingProvider } from "./aether";
export { isWithinLimit } from "./helpers";
export type { AetherBillingProviderConfig, BillingProviderConfig };
export type { BillingProvider, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, Entitlement, EntitlementsResponse, EntitlementsResult, Price, Product, Recurring, Subscription, } from "./interface";
