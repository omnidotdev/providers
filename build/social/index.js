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

// src/social/gatekeeper.ts
var REQUEST_TIMEOUT_MS = 5000;

class GatekeeperSocialProvider {
  config;
  constructor(config) {
    this.config = {
      ...config,
      timeoutMs: config.timeoutMs ?? REQUEST_TIMEOUT_MS
    };
  }
  async getConnections(userId) {
    try {
      const url = `${this.config.baseUrl}/social/connections/read?userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.serviceKey}`,
          Accept: "application/json"
        },
        signal: AbortSignal.timeout(this.config.timeoutMs)
      });
      if (!response.ok) {
        throw new Error(`social connections read failed: ${response.status}`);
      }
      const raw = await response.json();
      return Array.isArray(raw) ? raw : raw.connections ?? [];
    } catch (error) {
      log("error", "social", "connections read failed", {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }
  async getConnection(userId, platform) {
    const connections = await this.getConnections(userId);
    return connections.find((c) => c.platform === platform) ?? null;
  }
}

// src/social/index.ts
var createSocialProvider = (config) => new GatekeeperSocialProvider(config);
export {
  createSocialProvider,
  GatekeeperSocialProvider
};
