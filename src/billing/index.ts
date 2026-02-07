import { AetherBillingProvider } from "./aether";
import { LocalBillingProvider } from "./local";

import type { AetherBillingProviderConfig } from "./aether";
import type { BillingProvider } from "./interface";

type BillingProviderConfig = AetherBillingProviderConfig;

/**
 * Create a billing provider by name.
 * @param provider - Provider name ("aether" or "local")
 * @param config - Provider-specific configuration
 * @returns Configured billing provider instance
 * @throws When provider name is unknown or required config is missing
 */
const createBillingProvider = (
  provider: string,
  config?: BillingProviderConfig,
): BillingProvider => {
  switch (provider) {
    case "aether": {
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
    }
    case "local":
      return new LocalBillingProvider();
    default:
      throw new Error(`Unknown billing provider: ${provider}`);
  }
};

export { createBillingProvider };

export { AetherBillingProvider } from "./aether";
export { isWithinLimit } from "./helpers";
export { LocalBillingProvider } from "./local";

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
