import { AetherBillingProvider } from "./aether";

import type { AetherBillingProviderConfig } from "./aether";
import type { BillingProvider } from "./interface";

type BillingProviderConfig = AetherBillingProviderConfig;

/**
 * Create a billing provider.
 * @param config - Provider configuration
 * @returns Configured billing provider instance
 * @throws When required config is missing
 */
const createBillingProvider = (
  config: BillingProviderConfig,
): BillingProvider => {
  if (!config?.baseUrl) {
    throw new Error("AetherBillingProvider requires baseUrl in config");
  }
  if (!config?.appId) {
    throw new Error("AetherBillingProvider requires appId in config");
  }
  return new AetherBillingProvider({
    ...config,
    baseUrl: config.baseUrl,
    appId: config.appId,
  });
};

export { createBillingProvider };

export { AetherBillingProvider } from "./aether";
export { isWithinLimit } from "./helpers";

export type { AetherBillingProviderConfig, BillingProviderConfig };

export type {
  BillingProvider,
  CheckoutParams,
  CheckoutWithWorkspaceParams,
  CheckoutWithWorkspaceResponse,
  Entitlement,
  EntitlementsResponse,
  EntitlementsResult,
  Price,
  Product,
  Recurring,
  Subscription,
} from "./interface";
