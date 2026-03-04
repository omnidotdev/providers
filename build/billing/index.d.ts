import type { AetherBillingProviderConfig } from "./aether";
import type { BillingProvider } from "./interface";
import type { NoopBillingProviderConfig } from "./noop";
/**
 * Discriminated union config for `createBillingProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type BillingProviderConfig = ({
    provider: "aether";
} & AetherBillingProviderConfig) | ({
    provider: "noop";
} & NoopBillingProviderConfig) | NoopBillingProviderConfig;
/**
 * Create a billing provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured billing provider instance
 * @throws When required config is missing for the chosen variant
 */
declare const createBillingProvider: (config: BillingProviderConfig) => BillingProvider;
export { createBillingProvider };
export { AetherBillingProvider } from "./aether";
export { isWithinLimit } from "./helpers";
export { NoopBillingProvider } from "./noop";
export type { AetherBillingProviderConfig, BillingProviderConfig };
export type { BillingProvider, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, Entitlement, EntitlementsResponse, EntitlementsResult, Price, Product, Recurring, Subscription, } from "./interface";
export type { NoopBillingProviderConfig } from "./noop";
