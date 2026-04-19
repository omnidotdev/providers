import type {
  BillingProvider,
  CheckoutParams,
  CheckoutWithWorkspaceParams,
  CheckoutWithWorkspaceResponse,
  EntitlementsResponse,
  Price,
  Subscription,
} from "./interface";

// biome-ignore lint/complexity/noBannedTypes: intentionally empty config
type NoopBillingProviderConfig = {};

/**
 * No-op billing provider for self-hosted, dev, and testing.
 * Returns null for queries (consumers fall back to free-tier defaults).
 * Throws on write operations (checkout, portal, cancel).
 */
class NoopBillingProvider implements BillingProvider {
  async getEntitlements(
    _entityType: string,
    _entityId: string,
    _productId?: string,
    _accessToken?: string,
  ): Promise<EntitlementsResponse | null> {
    return null;
  }

  async checkEntitlement(
    _entityType: string,
    _entityId: string,
    _productId: string,
    _featureKey: string,
    _accessToken?: string,
  ): Promise<string | null> {
    return null;
  }

  async getPrices(_appName: string): Promise<Price[]> {
    return [];
  }

  async createCheckoutSession(_params: CheckoutParams): Promise<string> {
    throw new Error("Billing is not configured");
  }

  async createCheckoutWithWorkspace(
    _params: CheckoutWithWorkspaceParams,
  ): Promise<CheckoutWithWorkspaceResponse> {
    throw new Error("Billing is not configured");
  }

  async getSubscription(
    _entityType: string,
    _entityId: string,
    _accessToken: string,
  ): Promise<Subscription | null> {
    return null;
  }

  async getBillingPortalUrl(
    _entityType: string,
    _entityId: string,
    _productId: string,
    _returnUrl: string,
    _accessToken: string,
  ): Promise<string> {
    throw new Error("Billing is not configured");
  }

  async cancelSubscription(
    _entityType: string,
    _entityId: string,
    _accessToken: string,
  ): Promise<string> {
    throw new Error("Billing is not configured");
  }

  async renewSubscription(
    _entityType: string,
    _entityId: string,
    _accessToken: string,
  ): Promise<void> {}

  invalidateCache(_entityType: string, _entityId: string): void {}

  clearCache(): void {}

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: "noop" };
  }

  async close(): Promise<void> {}
}

export { NoopBillingProvider };

export type { NoopBillingProviderConfig };
