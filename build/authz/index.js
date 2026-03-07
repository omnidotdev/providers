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

// src/authz/warden.ts
var REQUEST_TIMEOUT_MS = 5000;
var DEFAULT_CACHE_TTL_MS = 120000;

class WardenAuthzProvider {
  config;
  circuitBreaker;
  permissionCache;
  constructor(config) {
    this.config = {
      ...config,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "warden-authz"
    });
    this.permissionCache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs
    });
  }
  async checkPermission(userId, resourceType, resourceId, permission, requestCache) {
    const cacheKey = buildCacheKey(userId, resourceType, resourceId, permission);
    if (requestCache?.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }
    const cached = this.permissionCache.get(cacheKey);
    if (cached !== null) {
      requestCache?.set(cacheKey, cached);
      return cached;
    }
    const startTime = Date.now();
    try {
      const allowed = await this.circuitBreaker.execute(async () => {
        const response = await fetch(`${this.config.apiUrl}/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.authHeaders()
          },
          body: JSON.stringify({
            user: `user:${userId}`,
            relation: permission,
            object: `${resourceType}:${resourceId}`
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        if (!response.ok) {
          throw new Error(`AuthZ check failed: ${response.status}`);
        }
        const result = await response.json();
        return result.allowed;
      });
      requestCache?.set(cacheKey, allowed);
      this.permissionCache.set(cacheKey, allowed);
      log("info", "authz", "permission check", {
        userId,
        resourceType,
        resourceId,
        permission,
        allowed,
        durationMs: Date.now() - startTime
      });
      return allowed;
    } catch (err) {
      log("error", "authz", "permission check failed", {
        userId,
        resourceType,
        resourceId,
        permission,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  async checkPermissionsBatch(checks, requestCache) {
    const results = [];
    const uncachedChecks = [];
    for (let i = 0;i < checks.length; i++) {
      const check = checks[i];
      const cacheKey = buildCacheKey(check.userId, check.resourceType, check.resourceId, check.permission);
      if (requestCache?.has(cacheKey)) {
        results[i] = { ...check, allowed: requestCache.get(cacheKey) };
        continue;
      }
      const cached = this.permissionCache.get(cacheKey);
      if (cached !== null) {
        requestCache?.set(cacheKey, cached);
        results[i] = { ...check, allowed: cached };
        continue;
      }
      uncachedChecks.push({ index: i, check });
    }
    if (uncachedChecks.length === 0)
      return results;
    const startTime = Date.now();
    try {
      const batchResults = await this.circuitBreaker.execute(async () => {
        const response = await fetch(`${this.config.apiUrl}/check/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.authHeaders()
          },
          body: JSON.stringify({
            checks: uncachedChecks.map(({ check }) => ({
              user: `user:${check.userId}`,
              relation: check.permission,
              object: `${check.resourceType}:${check.resourceId}`
            }))
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        if (!response.ok) {
          throw new Error(`AuthZ batch check failed: ${response.status}`);
        }
        const result = await response.json();
        return result.results;
      });
      for (let i = 0;i < uncachedChecks.length; i++) {
        const { index, check } = uncachedChecks[i];
        const allowed = batchResults[i].allowed;
        const cacheKey = buildCacheKey(check.userId, check.resourceType, check.resourceId, check.permission);
        requestCache?.set(cacheKey, allowed);
        this.permissionCache.set(cacheKey, allowed);
        results[index] = { ...check, allowed };
      }
      log("info", "authz", "batch permission check", {
        total: checks.length,
        fetched: uncachedChecks.length,
        durationMs: Date.now() - startTime
      });
      return results;
    } catch (err) {
      log("error", "authz", "batch permission check failed", {
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  async writeTuples(tuples, accessToken) {
    if (tuples.length === 0)
      return { success: true };
    if (this.config.vortexUrl && this.config.vortexWebhookSecret) {
      const result = await this.syncViaVortex("write", tuples);
      if (result.success)
        return result;
    }
    return this.syncDirect("POST", tuples, accessToken);
  }
  async deleteTuples(tuples, accessToken) {
    if (tuples.length === 0)
      return { success: true };
    if (this.config.vortexUrl && this.config.vortexWebhookSecret) {
      const result = await this.syncViaVortex("delete", tuples);
      if (result.success)
        return result;
    }
    return this.syncDirect("DELETE", tuples, accessToken);
  }
  invalidateCache(pattern) {
    this.permissionCache.invalidate(pattern);
  }
  clearCache() {
    this.permissionCache.clear();
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
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
  authHeaders() {
    if (this.config.serviceKey) {
      return { "X-Service-Key": this.config.serviceKey };
    }
    return {};
  }
  async syncViaVortex(operation, tuples) {
    try {
      const response = await fetch(`${this.config.vortexUrl}/webhooks/authz/${this.config.vortexWebhookSecret}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Event-Type": `authz.tuples.${operation}`
        },
        body: JSON.stringify({
          tuples,
          timestamp: new Date().toISOString(),
          source: this.config.source ?? "unknown"
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.ok) {
        log("info", "authz", `tuple ${operation} via Vortex`, {
          tupleCount: tuples.length
        });
        return { success: true };
      }
      log("warn", "authz", `Vortex ${operation} failed, falling back`, {
        status: response.status,
        tupleCount: tuples.length
      });
      return {
        success: false,
        error: `Vortex returned ${response.status}`
      };
    } catch (error) {
      log("warn", "authz", `Vortex ${operation} error, falling back`, {
        error: error instanceof Error ? error.message : String(error),
        tupleCount: tuples.length
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  async syncDirect(method, tuples, accessToken) {
    const operation = method === "POST" ? "write" : "delete";
    if (!this.config.serviceKey && !accessToken) {
      const errorMsg = "No service key or access token for Warden API authentication";
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length
      });
      return { success: false, error: errorMsg };
    }
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.config.serviceKey) {
        headers["X-Service-Key"] = this.config.serviceKey;
      } else if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const response = await fetch(`${this.config.apiUrl}/tuples`, {
        method,
        headers,
        body: JSON.stringify({ tuples }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.ok) {
        log("info", "authz", `tuple ${operation}`, {
          tupleCount: tuples.length
        });
        return { success: true };
      }
      const errorMsg = `Warden API returned ${response.status}`;
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length
      });
      return { success: false, error: errorMsg };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length
      });
      return { success: false, error: errorMsg };
    }
  }
}
function buildCacheKey(userId, resourceType, resourceId, permission) {
  return `${userId}:${resourceType}:${resourceId}:${permission}`;
}

// src/authz/index.ts
var createAuthzProvider = (config) => {
  if (!config?.apiUrl) {
    throw new Error("WardenAuthzProvider requires apiUrl in config");
  }
  return new WardenAuthzProvider({ ...config, apiUrl: config.apiUrl });
};
export {
  createAuthzProvider,
  WardenAuthzProvider
};
