import { TtlCache } from "../util/cache";
import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type {
  BillingProvider,
  CheckoutParams,
  CheckoutWithWorkspaceParams,
  CheckoutWithWorkspaceResponse,
  EntitlementsResponse,
  Price,
  Subscription,
} from "./interface";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Default cache TTL: 5 minutes */
const DEFAULT_CACHE_TTL_MS = 300_000;

type AetherBillingProviderConfig = {
  /** Aether billing service base URL */
  baseUrl?: string;
  /** Service API key for service-to-service auth */
  serviceApiKey?: string;
  /** Product identifier (e.g., "runa", "backfeed") */
  appId?: string;
  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
  /** Circuit breaker failure threshold */
  circuitBreakerThreshold?: number;
  /** Circuit breaker cooldown in milliseconds */
  circuitBreakerCooldownMs?: number;
};

/**
 * Aether billing provider.
 * Fetches entitlements from Aether billing service.
 *
 * Features:
 * - Circuit breaker to prevent thundering herd
 * - TTL cache for entitlements
 * - Service API key authentication
 * - Structured JSON logging
 */
type ValidatedAetherConfig = AetherBillingProviderConfig & {
  baseUrl: string;
  appId: string;
};

class AetherBillingProvider implements BillingProvider {
  private readonly config: Required<Pick<ValidatedAetherConfig, "cacheTtlMs">> &
    ValidatedAetherConfig;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly cache: TtlCache<EntitlementsResponse>;

  constructor(config: ValidatedAetherConfig) {
    this.config = {
      ...config,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "aether-billing",
    });
    this.cache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs,
    });
  }

  async getEntitlements(
    entityType: string,
    entityId: string,
    productId?: string,
    accessToken?: string,
  ): Promise<EntitlementsResponse | null> {
    const cacheKey = `${entityType}:${entityId}:${productId ?? "all"}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    if (this.circuitBreaker.isOpen()) {
      log("warn", "billing", "circuit breaker open, returning null");
      return null;
    }

    try {
      const appId = productId ?? this.config.appId;
      const url = new URL(
        `${this.config.baseUrl}/entitlements/${appId}/${entityType}/${entityId}`,
      );

      const headers: Record<string, string> = {};
      if (this.config.serviceApiKey) {
        headers["x-service-api-key"] = this.config.serviceApiKey;
      }
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        log("error", "billing", "failed to fetch entitlements", {
          status: response.status,
        });
        return null;
      }

      const result = (await response.json()) as EntitlementsResponse;

      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      log("error", "billing", "error fetching entitlements", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async checkEntitlement(
    entityType: string,
    entityId: string,
    productId: string,
    featureKey: string,
    accessToken?: string,
  ): Promise<string | null> {
    const entitlements = await this.getEntitlements(
      entityType,
      entityId,
      productId,
      accessToken,
    );
    if (!entitlements) return null;

    const entitlement = entitlements.entitlements.find(
      (e) => e.featureKey === featureKey,
    );

    return entitlement?.value ?? null;
  }

  async getPrices(appName: string): Promise<Price[]> {
    const response = await fetch(`${this.config.baseUrl}/prices/${appName}`, {
      headers: this.serviceHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const { prices } = (await response.json()) as { prices: Price[] };
    return prices;
  }

  async createCheckoutSession(params: CheckoutParams): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/checkout/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.serviceHeaders(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { error?: string }).error ||
          "Failed to create checkout session",
      );
    }

    const { url } = (await response.json()) as { url: string };
    return url;
  }

  async createCheckoutWithWorkspace(
    params: CheckoutWithWorkspaceParams,
  ): Promise<CheckoutWithWorkspaceResponse> {
    const response = await fetch(`${this.config.baseUrl}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        appId: params.appId,
        priceId: params.priceId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        ...(params.workspaceId && { workspaceId: params.workspaceId }),
        ...(params.createWorkspace && {
          createWorkspace: params.createWorkspace,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { error?: string }).error ||
          "Failed to create checkout session",
      );
    }

    return response.json();
  }

  async getSubscription(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<Subscription | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );

      if (!response.ok) return null;

      const { subscription } = (await response.json()) as {
        subscription: Subscription;
      };
      return subscription;
    } catch {
      return null;
    }
  }

  async getBillingPortalUrl(
    entityType: string,
    entityId: string,
    productId: string,
    returnUrl: string,
    accessToken: string,
  ): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/billing-portal/${entityType}/${entityId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ productId, returnUrl }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { error?: string }).error ||
          "Failed to get billing portal URL",
      );
    }

    const { url } = (await response.json()) as { url: string };
    return url;
  }

  async cancelSubscription(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { error?: string }).error || "Failed to cancel subscription",
      );
    }

    const { id } = (await response.json()) as { id: string };
    return id;
  }

  async renewSubscription(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}/renew`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { error?: string }).error || "Failed to renew subscription",
      );
    }
  }

  invalidateCache(entityType: string, entityId: string): void {
    this.cache.invalidateByPrefix(`${entityType}:${entityId}:`);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return {
        healthy: response.ok,
        message: response.ok ? "OK" : `Status ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private serviceHeaders(): Record<string, string> {
    if (this.config.serviceApiKey) {
      return { "x-service-api-key": this.config.serviceApiKey };
    }
    return {};
  }
}

export { AetherBillingProvider };

export type { AetherBillingProviderConfig };
