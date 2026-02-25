import { log } from "../util/log";

import type { FlagContext, FlagProvider } from "./interface";

const INIT_TIMEOUT_MS = 5_000;

type UnleashFlagProviderConfig = {
  /** Unleash server URL */
  url?: string;
  /** Unleash API key */
  apiKey?: string;
  /** Application name for Unleash registration */
  appName?: string;
  /** Polling interval in milliseconds */
  refreshInterval?: number;
  /** Default flag values used as fallback */
  defaults?: Record<string, boolean>;
  /** Skip Unleash entirely and use defaults only */
  devMode?: boolean;
};

type ValidatedUnleashConfig = UnleashFlagProviderConfig & {
  url: string;
  apiKey: string;
  appName: string;
};

/**
 * Unleash feature flags provider.
 * Evaluates flags against a remote Unleash server with local fallback.
 */
class UnleashFlagProvider implements FlagProvider {
  private readonly config: ValidatedUnleashConfig;
  private readonly defaults: Record<string, boolean>;
  private readonly devMode: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: Unleash SDK types are dynamic
  private client: any = null;
  private initialized = false;

  constructor(config: ValidatedUnleashConfig) {
    this.config = config;
    this.defaults = config.defaults ?? {};
    this.devMode = config.devMode ?? false;
  }

  async isEnabled(flagKey: string, context?: FlagContext): Promise<boolean> {
    if (this.devMode) {
      return this.defaults[flagKey] ?? false;
    }

    const client = await this.#requireClient();

    if (!client) {
      return this.defaults[flagKey] ?? false;
    }

    const unleashContext: Record<string, unknown> = {};

    if (context?.userId) {
      unleashContext.userId = context.userId;
    }

    if (context?.environment) {
      unleashContext.environment = context.environment;
    }

    const properties: Record<string, string> = {};

    if (context?.organizationId) {
      properties.organizationId = context.organizationId;
    }

    if (context?.properties) {
      Object.assign(properties, context.properties);
    }

    if (Object.keys(properties).length > 0) {
      unleashContext.properties = properties;
    }

    return client.isEnabled(flagKey, unleashContext);
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (this.devMode) {
      return { healthy: true, message: "dev mode" };
    }

    await this.#requireClient();

    if (this.client) {
      return { healthy: true, message: "OK" };
    }

    return { healthy: true, message: "fallback defaults" };
  }

  async close(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.initialized = false;
      log("info", "flags", "Unleash client closed");
    }
  }

  async #requireClient() {
    if (this.client) return this.client;
    if (this.initialized) return null;

    try {
      const { startUnleash } = await import("unleash-client");

      const unleashConfig: Record<string, unknown> = {
        url: this.config.url,
        appName: this.config.appName,
        customHeaders: { Authorization: this.config.apiKey },
      };

      if (this.config.refreshInterval) {
        unleashConfig.refreshInterval = this.config.refreshInterval;
      }

      // Race against timeout to avoid hanging on init
      this.client = await Promise.race([
        startUnleash(
          unleashConfig as unknown as Parameters<typeof startUnleash>[0],
        ),
        new Promise<never>((_resolve, reject) =>
          setTimeout(
            () => reject(new Error("Unleash init timed out")),
            INIT_TIMEOUT_MS,
          ),
        ),
      ]);

      this.initialized = true;

      log("info", "flags", "Unleash client connected", {
        url: this.config.url,
        appName: this.config.appName,
      });

      return this.client;
    } catch (error) {
      // Graceful degradation: mark initialized to avoid retries, fall back to defaults
      this.initialized = true;

      log("warn", "flags", "Unleash init failed, falling back to defaults", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return null;
    }
  }
}

export { UnleashFlagProvider };

export type { UnleashFlagProviderConfig };
