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

// src/notifications/herald.ts
var toBareEmail = (address) => {
  const match = address.match(/<([^>]+)>/);
  return (match ? match[1] : address).trim();
};

class HeraldNotificationProvider {
  config;
  circuitBreaker;
  constructor(config) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "herald-notifications"
    });
  }
  async sendEmail(params) {
    try {
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      let lastMessageId;
      for (const [index, recipient] of recipients.entries()) {
        const body = {
          to: toBareEmail(recipient),
          from: toBareEmail(params.from ?? this.config.defaultFrom),
          subject: params.subject,
          html: params.body,
          ...params.html ? {} : { text: params.body },
          ...params.replyTo ? { replyTo: toBareEmail(params.replyTo) } : {},
          ...params.headers ? { headers: params.headers } : {},
          ...index === 0 && params.cc?.length ? { cc: params.cc.map(toBareEmail) } : {},
          ...index === 0 && params.bcc?.length ? { bcc: params.bcc.map(toBareEmail) } : {}
        };
        lastMessageId = await this.circuitBreaker.execute(async () => this.#postMessage(body));
      }
      log("info", "notifications", "email sent", {
        messageId: lastMessageId,
        to: recipients
      });
      return { success: true, messageId: lastMessageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log("error", "notifications", "email send failed", {
        error: message
      });
      return { success: false, error: message };
    }
  }
  async sendEmailBatch(params) {
    return Promise.all(params.map((p) => this.sendEmail(p)));
  }
  async healthCheck() {
    return {
      healthy: !this.circuitBreaker.isOpen(),
      message: this.circuitBreaker.isOpen() ? "circuit open" : "OK"
    };
  }
  async#postMessage(body) {
    const response = await fetch(`${this.config.apiUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const detail = await response.json().then((data2) => data2.error).catch(() => {
        return;
      });
      throw new Error(`Herald responded ${response.status}${detail ? `: ${detail}` : ""}`);
    }
    const data = await response.json();
    return data.id;
  }
}

// src/notifications/noop.ts
class NoopNotificationProvider {
  async sendEmail(_params) {
    return { success: true, messageId: crypto.randomUUID() };
  }
  async sendEmailBatch(params) {
    return params.map(() => ({
      success: true,
      messageId: crypto.randomUUID()
    }));
  }
  async healthCheck() {
    return { healthy: true, message: "noop" };
  }
  async close() {}
}

// src/notifications/index.ts
var createNotificationProvider = (config) => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopNotificationProvider;
  }
  if (config.provider === "herald") {
    if (!config.apiKey) {
      throw new Error("HeraldNotificationProvider requires apiKey in config");
    }
    if (!config.apiUrl) {
      throw new Error("HeraldNotificationProvider requires apiUrl in config");
    }
    if (!config.defaultFrom) {
      throw new Error("HeraldNotificationProvider requires defaultFrom in config");
    }
    return new HeraldNotificationProvider({
      ...config,
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      defaultFrom: config.defaultFrom
    });
  }
  const _exhaustive = config;
  throw new Error(`Unknown notification provider: ${_exhaustive}`);
};
export {
  createNotificationProvider,
  NoopNotificationProvider,
  HeraldNotificationProvider
};
