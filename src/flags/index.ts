import { FractalFlagProvider } from "./fractal";
import { NoopFlagProvider } from "./noop";
import { UnleashFlagProvider } from "./unleash";

import type { FractalFlagProviderConfig } from "./fractal";
import type { FlagProvider } from "./interface";
import type { NoopFlagProviderConfig } from "./noop";
import type { UnleashFlagProviderConfig } from "./unleash";

/**
 * Discriminated union config for `createFlagProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type FlagProviderConfig =
  | ({ provider: "unleash" } & UnleashFlagProviderConfig)
  | ({ provider: "fractal" } & FractalFlagProviderConfig)
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
    if (!config.url || !config.apiKey || !config.appName) {
      const missing = [
        !config.url && "url",
        !config.apiKey && "apiKey",
        !config.appName && "appName",
      ].filter(Boolean);
      console.warn(
        `UnleashFlagProvider missing ${missing.join(", ")}, falling back to noop`,
      );
      return new NoopFlagProvider({});
    }
    return new UnleashFlagProvider({
      ...config,
      url: config.url,
      apiKey: config.apiKey,
      appName: config.appName,
    });
  }

  if (config.provider === "fractal") {
    if (!config.url || !config.project) {
      const missing = [
        !config.url && "url",
        !config.project && "project",
      ].filter(Boolean);
      console.warn(
        `FractalFlagProvider missing ${missing.join(", ")}, falling back to noop`,
      );
      return new NoopFlagProvider({});
    }
    return new FractalFlagProvider({
      ...config,
      url: config.url,
      project: config.project,
    });
  }

  // Exhaustive check
  const _exhaustive: never = config;
  throw new Error(`Unknown flag provider: ${_exhaustive}`);
};

export { createFlagProvider };

export { FractalFlagProvider } from "./fractal";
export { NoopFlagProvider } from "./noop";
export { UnleashFlagProvider } from "./unleash";

export type { FlagProviderConfig };

export type { FractalFlagProviderConfig } from "./fractal";
export type { FlagContext, FlagProvider } from "./interface";
export type { NoopFlagProviderConfig } from "./noop";
export type { UnleashFlagProviderConfig } from "./unleash";
