import { LocalAuthzProvider } from "./local";
import { WardenAuthzProvider } from "./warden";

import type { AuthzProvider } from "./interface";
import type { WardenAuthzProviderConfig } from "./warden";

type AuthzProviderConfig = WardenAuthzProviderConfig;

/**
 * Create an authorization provider by name.
 * @param provider - Provider name ("warden" or "local")
 * @param config - Provider-specific configuration
 */
const createAuthzProvider = (
  provider: string,
  config?: AuthzProviderConfig,
): AuthzProvider => {
  switch (provider) {
    case "warden": {
      if (!config?.apiUrl) {
        throw new Error("WardenAuthzProvider requires apiUrl in config");
      }
      return new WardenAuthzProvider(config);
    }
    case "local":
      return new LocalAuthzProvider();
    default:
      throw new Error(`Unknown authz provider: ${provider}`);
  }
};

export { createAuthzProvider };

export { LocalAuthzProvider } from "./local";
export { WardenAuthzProvider } from "./warden";

export type { AuthzProviderConfig };

export type {
  AuthzProvider,
  AuthzTuple,
  PermissionCheck,
  PermissionCheckResult,
  TupleSyncResult,
} from "./interface";
export type { WardenAuthzProviderConfig } from "./warden";
