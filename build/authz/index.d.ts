import type { AuthzProvider } from "./interface";
import type { WardenAuthzProviderConfig } from "./warden";
type AuthzProviderConfig = WardenAuthzProviderConfig;
/**
 * Create an authorization provider by name.
 * @param provider - Provider name ("warden" or "local")
 * @param config - Provider-specific configuration
 * @returns Configured authorization provider instance
 * @throws When provider name is unknown or required config is missing
 */
declare const createAuthzProvider: (provider: string, config?: AuthzProviderConfig) => AuthzProvider;
export { createAuthzProvider };
export { LocalAuthzProvider } from "./local";
export { WardenAuthzProvider } from "./warden";
export type { AuthzProviderConfig };
export type { AuthzProvider, AuthzTuple, PermissionCheck, PermissionCheckResult, TupleSyncResult, } from "./interface";
export type { WardenAuthzProviderConfig } from "./warden";
