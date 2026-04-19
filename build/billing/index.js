// src/util/cache.ts
var DEFAULT_TTL_MS = 300000;

class TtlCache {
  cache = new Map;
  defaultTtlMs;
  constructor(config) {
    this.defaultTtlMs = config?.defaultTtlMs ?? DEFAULT_TTL_MS;
  }
  get(key, version) {
    const entry = this.cache.get(key);
    if (!entry)
      return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    if (version !== undefined && entry.version !== version) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  set(key, value, ttlMs, version) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      version
    });
  }
  has(key) {
    return this.get(key) !== null;
  }
  delete(key) {
    this.cache.delete(key);
  }
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  invalidateByPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  clear() {
    this.cache.clear();
  }
  get size() {
    return this.cache.size;
  }
}

// src/util/log.ts
function log(level, module, message, data) {
  const entry = {
    level,
    module,
    message,
    ...data,
    timestamp: new Date().toISOString()
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}

// src/util/circuitBreaker.ts
var DEFAULT_THRESHOLD = 5;
var DEFAULT_COOLDOWN_MS = 30000;

class CircuitBreaker {
  state = "closed";
  failures = 0;
  lastFailureTime = 0;
  threshold;
  cooldownMs;
  label;
  constructor(config) {
    this.threshold = config?.threshold ?? DEFAULT_THRESHOLD;
    this.cooldownMs = config?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.label = config?.label ?? "circuit-breaker";
  }
  async execute(fn) {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = "half-open";
        log("info", this.label, "circuit half-open, attempting recovery");
      } else {
        throw new Error(`${this.label}: service unavailable (circuit open)`);
      }
    }
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  isOpen() {
    if (this.state !== "open")
      return false;
    if (Date.now() - this.lastFailureTime > this.cooldownMs) {
      this.state = "half-open";
      return false;
    }
    return true;
  }
  reset() {
    if (this.failures > 0 || this.state !== "closed") {
      log("info", this.label, "circuit closed");
    }
    this.failures = 0;
    this.state = "closed";
  }
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "open";
      log("error", this.label, `circuit opened after ${this.failures} consecutive failures`);
    }
  }
}

// src/billing/aether.ts
var REQUEST_TIMEOUT_MS = 5000;
var DEFAULT_CACHE_TTL_MS = 300000;

class AetherBillingProvider {
  config;
  circuitBreaker;
  cache;
  constructor(config) {
    this.config = {
      ...config,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "aether-billing"
    });
    this.cache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs
    });
  }
  async getEntitlements(entityType, entityId, productId, accessToken) {
    const cacheKey = `${entityType}:${entityId}:${productId ?? "all"}`;
    const cached = this.cache.get(cacheKey);
    if (cached)
      return cached;
    if (this.circuitBreaker.isOpen()) {
      log("warn", "billing", "circuit breaker open, returning null");
      return null;
    }
    try {
      const appId = productId ?? this.config.appId;
      const url = new URL(`${this.config.baseUrl}/entitlements/${appId}/${entityType}/${entityId}`);
      const headers = {};
      if (this.config.serviceApiKey) {
        headers["x-service-api-key"] = this.config.serviceApiKey;
      }
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const response = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        log("error", "billing", "failed to fetch entitlements", {
          status: response.status
        });
        return null;
      }
      const result = await response.json();
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      log("error", "billing", "error fetching entitlements", {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  async checkEntitlement(entityType, entityId, productId, featureKey, accessToken) {
    const entitlements = await this.getEntitlements(entityType, entityId, productId, accessToken);
    if (!entitlements)
      return null;
    const entitlement = entitlements.entitlements.find((e) => e.featureKey === featureKey);
    return entitlement?.value ?? null;
  }
  async getPrices(appName) {
    const response = await fetch(`${this.config.baseUrl}/prices/${appName}`, {
      headers: this.serviceHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok)
      return [];
    const { prices } = await response.json();
    return prices;
  }
  async createCheckoutSession(params) {
    const response = await fetch(`${this.config.baseUrl}/checkout/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.serviceHeaders()
      },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? "Failed to create checkout session");
    }
    const { url } = await response.json();
    return url;
  }
  async createCheckoutWithWorkspace(params) {
    const response = await fetch(`${this.config.baseUrl}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.accessToken}`
      },
      body: JSON.stringify({
        appId: params.appId,
        priceId: params.priceId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        ...params.workspaceId && { workspaceId: params.workspaceId },
        ...params.createWorkspace && {
          createWorkspace: params.createWorkspace
        },
        ...params.quantity && { quantity: params.quantity },
        ...params.bundleSlug && { bundleSlug: params.bundleSlug }
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? "Failed to create checkout session");
    }
    return response.json();
  }
  async getSubscription(entityType, entityId, accessToken) {
    try {
      const response = await fetch(`${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (!response.ok)
        return null;
      const { subscription } = await response.json();
      return subscription;
    } catch {
      return null;
    }
  }
  async getBillingPortalUrl(entityType, entityId, productId, returnUrl, accessToken) {
    const response = await fetch(`${this.config.baseUrl}/billing-portal/${entityType}/${entityId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ productId, returnUrl })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? "Failed to get billing portal URL");
    }
    const { url } = await response.json();
    return url;
  }
  async cancelSubscription(entityType, entityId, accessToken) {
    const response = await fetch(`${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? "Failed to cancel subscription");
    }
    const { id } = await response.json();
    return id;
  }
  async renewSubscription(entityType, entityId, accessToken) {
    const response = await fetch(`${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}/renew`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? "Failed to renew subscription");
    }
  }
  invalidateCache(entityType, entityId) {
    this.cache.invalidateByPrefix(`${entityType}:${entityId}:`);
  }
  clearCache() {
    this.cache.clear();
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      return {
        healthy: response.ok,
        message: response.ok ? "OK" : `Status ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async close() {}
  serviceHeaders() {
    if (this.config.serviceApiKey) {
      return { "x-service-api-key": this.config.serviceApiKey };
    }
    return {};
  }
}

// src/billing/noop.ts
class NoopBillingProvider {
  async getEntitlements(_entityType, _entityId, _productId, _accessToken) {
    return null;
  }
  async checkEntitlement(_entityType, _entityId, _productId, _featureKey, _accessToken) {
    return null;
  }
  async getPrices(_appName) {
    return [];
  }
  async createCheckoutSession(_params) {
    throw new Error("Billing is not configured");
  }
  async createCheckoutWithWorkspace(_params) {
    throw new Error("Billing is not configured");
  }
  async getSubscription(_entityType, _entityId, _accessToken) {
    return null;
  }
  async getBillingPortalUrl(_entityType, _entityId, _productId, _returnUrl, _accessToken) {
    throw new Error("Billing is not configured");
  }
  async cancelSubscription(_entityType, _entityId, _accessToken) {
    throw new Error("Billing is not configured");
  }
  async renewSubscription(_entityType, _entityId, _accessToken) {}
  invalidateCache(_entityType, _entityId) {}
  clearCache() {}
  async healthCheck() {
    return { healthy: true, message: "noop" };
  }
  async close() {}
}
// src/billing/helpers.ts
var isWithinLimit = (entitlements, featureKey, currentCount, defaultLimits) => {
  if (!entitlements) {
    const freeLimit = defaultLimits?.[featureKey]?.free;
    if (freeLimit === undefined || freeLimit === -1)
      return true;
    return currentCount < freeLimit;
  }
  const entitlement = entitlements.entitlements.find((e) => e.featureKey === featureKey);
  if (entitlement?.value) {
    const limit = Number(entitlement.value);
    if (limit === -1 || Number.isNaN(limit))
      return true;
    return currentCount < limit;
  }
  if (defaultLimits) {
    const tierEntitlement = entitlements.entitlements.find((e) => e.featureKey === "tier");
    const tier = tierEntitlement?.value ?? "free";
    const limit = defaultLimits[featureKey]?.[tier];
    if (limit === undefined || limit === -1)
      return true;
    return currentCount < limit;
  }
  return true;
};

// src/billing/index.ts
var createBillingProvider = (config) => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopBillingProvider;
  }
  if (config.provider === "aether") {
    if (!config.baseUrl) {
      throw new Error("AetherBillingProvider requires baseUrl in config");
    }
    if (!config.appId) {
      throw new Error("AetherBillingProvider requires appId in config");
    }
    return new AetherBillingProvider({
      ...config,
      baseUrl: config.baseUrl,
      appId: config.appId
    });
  }
  const _exhaustive = config;
  throw new Error(`Unknown billing provider: ${_exhaustive}`);
};
export {
  isWithinLimit,
  createBillingProvider,
  NoopBillingProvider,
  AetherBillingProvider
};
