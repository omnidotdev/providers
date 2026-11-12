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
export { AetherBillingProvider } from "./aether";
export { createEntitlementCapResolver, createStaticCapResolver, } from "./capResolver";
export { DEFAULT_CREDIT_COGS_MARKUP, creditsFromCostCents, isWithinLimit, } from "./helpers";
export { NoopBillingProvider } from "./noop";
export { BILLING_WRITE_FAILED_EVENT, isPermissionError, probeWriteScope, safePaymentWrite, } from "./safePaymentWrite";
export { createSpendBreaker, utcDayKey } from "./spendBreaker";
export type { CapResolver, EntitlementCapResolverConfig, } from "./capResolver";
export type { BillingProvider, CheckoutParams, CheckoutWithWorkspaceParams, CheckoutWithWorkspaceResponse, Entitlement, EntitlementsResponse, EntitlementsResult, PortalFlow, Price, Product, Recurring, Subscription, } from "./interface";
export type { NoopBillingProviderConfig } from "./noop";
export type { AlertEventsProvider, SafePaymentWriteOptions, ScopeProbeResult, } from "./safePaymentWrite";
export type { SpendBreaker } from "./spendBreaker";
export type { AetherBillingProviderConfig, BillingProviderConfig };
export { createBillingProvider };
