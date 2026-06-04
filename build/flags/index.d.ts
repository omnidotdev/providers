import type { FractalFlagProviderConfig } from "./fractal";
import type { FlagProvider } from "./interface";
import type { NoopFlagProviderConfig } from "./noop";
import type { UnleashFlagProviderConfig } from "./unleash";
/**
 * Discriminated union config for `createFlagProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type FlagProviderConfig = ({
    provider: "unleash";
} & UnleashFlagProviderConfig) | ({
    provider: "fractal";
} & FractalFlagProviderConfig) | ({
    provider: "noop";
} & NoopFlagProviderConfig) | NoopFlagProviderConfig;
/**
 * Create a feature flags provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured flag provider instance
 * @throws When required config is missing for the chosen variant
 */
declare const createFlagProvider: (config: FlagProviderConfig) => FlagProvider;
export { createFlagProvider };
export { FractalFlagProvider } from "./fractal";
export { NoopFlagProvider } from "./noop";
export { UnleashFlagProvider } from "./unleash";
export type { FlagProviderConfig };
export type { FractalFlagProviderConfig } from "./fractal";
export type { FlagContext, FlagProvider } from "./interface";
export type { NoopFlagProviderConfig } from "./noop";
export type { UnleashFlagProviderConfig } from "./unleash";
