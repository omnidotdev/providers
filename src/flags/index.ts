import { NoopFlagProvider } from "./noop";
import { UnleashFlagProvider } from "./unleash";

import type { FlagProvider } from "./interface";
import type { NoopFlagProviderConfig } from "./noop";
import type { UnleashFlagProviderConfig } from "./unleash";

/**
 * Discriminated union config for `createFlagProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type FlagProviderConfig =
  | ({ provider: "unleash" } & UnleashFlagProviderConfig)
  | ({ provider: "noop" } & NoopFlagProviderConfig)
  | NoopFlagProviderConfig;

/**
 * Create a feature flags provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured flag provider instance
 * @throws When required config is missing for the chosen variant
 */
const createFlagProvider = (config: FlagProviderConfig): FlagProvider => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopFlagProvider(config);
  }

  if (config.provider === "unleash") {
    if (!config.url) {
      throw new Error("UnleashFlagProvider requires url in config");
    }
    if (!config.apiKey) {
      throw new Error("UnleashFlagProvider requires apiKey in config");
    }
    if (!config.appName) {
      throw new Error("UnleashFlagProvider requires appName in config");
    }
    return new UnleashFlagProvider({
      ...config,
      url: config.url,
      apiKey: config.apiKey,
      appName: config.appName,
    });
  }

  // Exhaustive check
  const _exhaustive: never = config;
  throw new Error(`Unknown flag provider: ${_exhaustive}`);
};

export { createFlagProvider };

export { NoopFlagProvider } from "./noop";
export { UnleashFlagProvider } from "./unleash";

export type { FlagProviderConfig };

export type { FlagContext, FlagProvider } from "./interface";
export type { NoopFlagProviderConfig } from "./noop";
export type { UnleashFlagProviderConfig } from "./unleash";
