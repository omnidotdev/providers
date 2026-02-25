import type { GatekeeperApiKeyProviderConfig } from "./gatekeeper";
import type { ApiKeyProvider } from "./interface";
import type { NoopApiKeyProviderConfig } from "./noop";
/**
 * Discriminated union config for `createApiKeyProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type ApiKeyProviderConfig = ({
    provider: "gatekeeper";
} & GatekeeperApiKeyProviderConfig) | ({
    provider: "noop";
} & NoopApiKeyProviderConfig) | NoopApiKeyProviderConfig;
/**
 * Create an API key provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured API key provider instance
 * @throws When required config is missing for the chosen variant
 */
declare const createApiKeyProvider: (config: ApiKeyProviderConfig) => ApiKeyProvider;
export { createApiKeyProvider };
export { GatekeeperApiKeyProvider } from "./gatekeeper";
export { NoopApiKeyProvider } from "./noop";
export type { ApiKeyProviderConfig };
export type { GatekeeperApiKeyProviderConfig } from "./gatekeeper";
export type { ApiKeyInfo, ApiKeyProvider } from "./interface";
export type { NoopApiKeyProviderConfig } from "./noop";
