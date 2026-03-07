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

// src/apiKey/gatekeeper.ts
var REQUEST_TIMEOUT_MS = 5000;
var DEFAULT_CACHE_TTL_MS = 120000;

class GatekeeperApiKeyProvider {
  config;
  circuitBreaker;
  keyCache;
  constructor(config) {
    this.config = {
      ...config,
      timeoutMs: config.timeoutMs ?? REQUEST_TIMEOUT_MS,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "gatekeeper-api-key"
    });
    this.keyCache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs
    });
  }
  async verifyApiKey(key) {
    const cached = this.keyCache.get(key);
    if (cached !== null) {
      return cached;
    }
    const startTime = Date.now();
    try {
      const info = await this.circuitBreaker.execute(async () => {
        const response = await fetch(`${this.config.authBaseUrl}/api-key/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: this.config.authBaseUrl
          },
          body: JSON.stringify({ key }),
          signal: AbortSignal.timeout(this.config.timeoutMs)
        });
        if (!response.ok) {
          throw new Error(`API key verification failed: ${response.status}`);
        }
        const raw = await response.json();
        if (!raw.valid || !raw.key) {
          return null;
        }
        let parsedMetadata;
        if (raw.key.metadata) {
          try {
            parsedMetadata = JSON.parse(raw.key.metadata);
          } catch {
            log("warn", "api-key", "failed to parse metadata JSON", {
              keyId: raw.key.id
            });
          }
        }
        const orgId = parsedMetadata?.organizationId;
        const result = {
          id: raw.key.id,
          name: raw.key.name ?? "",
          userId: raw.key.userId,
          organizationId: typeof orgId === "string" ? orgId : "",
          metadata: parsedMetadata
        };
        return result;
      });
      if (!info) {
        log("info", "api-key", "key invalid", {
          durationMs: Date.now() - startTime
        });
        return null;
      }
      this.keyCache.set(key, info);
      log("info", "api-key", "key verified", {
        keyId: info.id,
        userId: info.userId,
        durationMs: Date.now() - startTime
      });
      return info;
    } catch (err) {
      log("error", "api-key", "key verification failed", {
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err)
      });
      return null;
    }
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.authBaseUrl}/health`, {
        signal: AbortSignal.timeout(this.config.timeoutMs)
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
}

// src/apiKey/noop.ts
class NoopApiKeyProvider {
  mockResult;
  constructor(config) {
    this.mockResult = config?.mockResult ?? null;
  }
  async verifyApiKey(_key) {
    return this.mockResult;
  }
  async healthCheck() {
    return { healthy: true, message: "noop" };
  }
  async close() {}
}

// src/apiKey/index.ts
var createApiKeyProvider = (config) => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopApiKeyProvider("provider" in config ? config : undefined);
  }
  if (config.provider === "gatekeeper") {
    if (!config.authBaseUrl) {
      throw new Error("GatekeeperApiKeyProvider requires authBaseUrl in config");
    }
    return new GatekeeperApiKeyProvider({
      ...config,
      authBaseUrl: config.authBaseUrl
    });
  }
  const _exhaustive = config;
  throw new Error(`Unknown API key provider: ${_exhaustive}`);
};
export {
  createApiKeyProvider,
  NoopApiKeyProvider,
  GatekeeperApiKeyProvider
};
