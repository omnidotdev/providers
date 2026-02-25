import { GatekeeperApiKeyProvider } from "./gatekeeper";
import { NoopApiKeyProvider } from "./noop";

import type { GatekeeperApiKeyProviderConfig } from "./gatekeeper";
import type { ApiKeyProvider } from "./interface";
import type { NoopApiKeyProviderConfig } from "./noop";

/**
 * Discriminated union config for `createApiKeyProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type ApiKeyProviderConfig =
  | ({ provider: "gatekeeper" } & GatekeeperApiKeyProviderConfig)
  | ({ provider: "noop" } & NoopApiKeyProviderConfig)
  | NoopApiKeyProviderConfig;

/**
 * Create an API key provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured API key provider instance
 * @throws When required config is missing for the chosen variant
 */
const createApiKeyProvider = (config: ApiKeyProviderConfig): ApiKeyProvider => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopApiKeyProvider("provider" in config ? config : undefined);
  }

  if (config.provider === "gatekeeper") {
    if (!config.authBaseUrl) {
      throw new Error(
        "GatekeeperApiKeyProvider requires authBaseUrl in config",
      );
    }
    return new GatekeeperApiKeyProvider({
      ...config,
      authBaseUrl: config.authBaseUrl,
    });
  }

  // Exhaustive check
  const _exhaustive: never = config;
  throw new Error(`Unknown API key provider: ${_exhaustive}`);
};

export { createApiKeyProvider };

export { GatekeeperApiKeyProvider } from "./gatekeeper";
export { NoopApiKeyProvider } from "./noop";

export type { ApiKeyProviderConfig };

export type { GatekeeperApiKeyProviderConfig } from "./gatekeeper";
export type { ApiKeyInfo, ApiKeyProvider } from "./interface";
export type { NoopApiKeyProviderConfig } from "./noop";
