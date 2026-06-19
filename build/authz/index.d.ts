import type { AuthzProvider } from "./interface";
import type { WardenAuthzProviderConfig } from "./warden";
type AuthzProviderConfig = WardenAuthzProviderConfig;
/**
 * Create an authorization provider.
 * @param config - Provider configuration
 * @returns Configured authorization provider instance
 * @throws When required config is missing
 */
declare const createAuthzProvider: (config: AuthzProviderConfig) => AuthzProvider;
export { createAuthzProvider };
export { WARDEN_RELATIONS } from "./relations";
export { WardenAuthzProvider } from "./warden";
export type { AuthzProviderConfig };
export type { AuthzProvider, AuthzTuple, PermissionCheck, PermissionCheckResult, TupleSyncResult, } from "./interface";
export type { WardenRelation, WardenResourceType } from "./relations";
export type { WardenAuthzProviderConfig } from "./warden";
