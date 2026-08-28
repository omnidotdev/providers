import { TtlCache } from "../util/cache";
import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type {
  BillingProvider,
  CheckoutParams,
  CheckoutWithWorkspaceParams,
  CheckoutWithWorkspaceResponse,
  EntitlementsResponse,
  EntitlementsResult,
  PortalFlow,
  Price,
  Subscription,
} from "./interface";

/** Request timeout in milliseconds, per attempt */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Retries for transient read failures (timeout / network error / 5xx).
 * Reads are idempotent, so retrying is safe. Prevents a single slow Aether
 * response from surfacing as "no subscription" (a Free-tier false negative).
 */
const REQUEST_RETRIES = 2;

/** Base backoff between retries in milliseconds (doubles each attempt) */
const RETRY_BACKOFF_MS = 200;

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
    // Backward-compatible null shape: callers that only fail-open keep working.
    // The discriminated variant below is for callers that must tell an Aether
    // error apart from a legit no-account (to fail closed safely)
    const result = await this.getEntitlementsResult(
      entityType,
      entityId,
      productId,
      accessToken,
    );
    return result.status === "success" ? result.data : null;
  }

  /**
   * Like {@link getEntitlements} but distinguishes the three outcomes a caller
   * needs to fail closed safely:
   *  - `success`: entitlements resolved (the tenant's real tier).
   *  - `not_found`: a 404 - the entity has no billing account (legitimately on
   *    the free tier); NOT an error.
   *  - `unavailable`: Aether is unreachable / erroring (circuit open, non-2xx,
   *    or a thrown request). The caller decides whether to fail open or closed.
   */
  async getEntitlementsResult(
    entityType: string,
    entityId: string,
    productId?: string,
    accessToken?: string,
  ): Promise<EntitlementsResult> {
    const cacheKey = `${entityType}:${entityId}:${productId ?? "all"}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return { status: "success", data: cached };

    if (this.circuitBreaker.isOpen()) {
      log("warn", "billing", "circuit breaker open, entitlements unavailable");
      return { status: "unavailable", error: "circuit breaker open" };
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

      const response = await this.resilientFetch(url.toString(), { headers });

      if (response.status === 404) {
        return { status: "not_found" };
      }

      if (!response.ok) {
        log("error", "billing", "failed to fetch entitlements", {
          status: response.status,
        });
        return { status: "unavailable", error: `status ${response.status}` };
      }

      const result = (await response.json()) as EntitlementsResponse;

      this.cache.set(cacheKey, result);

      return { status: "success", data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log("error", "billing", "error fetching entitlements", {
        error: message,
      });
      return { status: "unavailable", error: message };
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
    const response = await this.resilientFetch(
      `${this.config.baseUrl}/prices/${appName}`,
      { headers: this.serviceHeaders() },
    );

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
      const error = await response.json().catch(() => null);
      throw new Error(
        (error as { error?: string } | null)?.error ??
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
        ...(params.quantity && { quantity: params.quantity }),
        ...(params.bundleSlug && { bundleSlug: params.bundleSlug }),
        ...(params.trialPeriodDays !== undefined && {
          trialPeriodDays: params.trialPeriodDays,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        (error as { error?: string } | null)?.error ??
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
      const response = await this.resilientFetch(
        `${this.config.baseUrl}/billing-portal/subscription/${this.config.appId}/${entityType}/${entityId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
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

  async listSubscriptions(
    entityType: string,
    entityId: string,
    accessToken: string,
  ): Promise<Subscription[]> {
    try {
      const response = await this.resilientFetch(
        `${this.config.baseUrl}/billing-portal/subscriptions/${this.config.appId}/${entityType}/${entityId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) return [];

      const { subscriptions } = (await response.json()) as {
        subscriptions: Subscription[];
      };
      return subscriptions;
    } catch {
      return [];
    }
  }

  async getBillingPortalUrl(
    entityType: string,
    entityId: string,
    productId: string,
    returnUrl: string,
    accessToken: string,
    flow?: PortalFlow,
  ): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/billing-portal/${productId}/${entityType}/${entityId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ productId, returnUrl, ...(flow && { flow }) }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        (error as { error?: string } | null)?.error ??
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
      `${this.config.baseUrl}/billing-portal/subscription/${this.config.appId}/${entityType}/${entityId}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        (error as { error?: string } | null)?.error ??
          "Failed to cancel subscription",
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
      `${this.config.baseUrl}/billing-portal/subscription/${this.config.appId}/${entityType}/${entityId}/renew`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        (error as { error?: string } | null)?.error ??
          "Failed to renew subscription",
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

  async close(): Promise<void> {}

  private serviceHeaders(): Record<string, string> {
    if (this.config.serviceApiKey) {
      return { "x-service-api-key": this.config.serviceApiKey };
    }
    return {};
  }

  /**
   * Fetch a read endpoint with a per-attempt timeout and retries on transient
   * failures (timeout, network error, or 5xx). Definitive responses (2xx-4xx)
   * return immediately so callers can handle 404/403 as they do today. Only use
   * for idempotent reads; write operations must not be retried.
   */
  private async resilientFetch(
    url: string,
    init: RequestInit = {},
  ): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          ...init,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        // Retry only transient server errors; 2xx-4xx are definitive
        if (response.status >= 500 && attempt < REQUEST_RETRIES) {
          lastError = new Error(`HTTP ${response.status}`);
          await this.backoff(attempt);
          continue;
        }

        return response;
      } catch (error) {
        // Timeout (AbortError) or network failure: retry if attempts remain
        lastError = error;
        if (attempt < REQUEST_RETRIES) {
          await this.backoff(attempt);
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Request failed after retries");
  }

  private backoff(attempt: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, RETRY_BACKOFF_MS * 2 ** attempt);
    });
  }
}

export { AetherBillingProvider };

export type { AetherBillingProviderConfig };
