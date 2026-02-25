import type { FlagContext, FlagProvider } from "./interface";

type NoopFlagProviderConfig = {
  /** Default flag values to return */
  defaults?: Record<string, boolean>;
};

/**
 * No-op feature flags provider.
 * Returns static defaults — useful for dev, testing, and SSR.
 */
class NoopFlagProvider implements FlagProvider {
  private readonly defaults: Record<string, boolean>;

  constructor(config: NoopFlagProviderConfig = {}) {
    this.defaults = config.defaults ?? {};
  }

  async isEnabled(flagKey: string, _context?: FlagContext): Promise<boolean> {
    return this.defaults[flagKey] ?? false;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: "noop" };
  }

  async close(): Promise<void> {}
}

export { NoopFlagProvider };

export type { NoopFlagProviderConfig };
