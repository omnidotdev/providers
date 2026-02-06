import type {
  AuthzProvider,
  AuthzTuple,
  PermissionCheck,
  PermissionCheckResult,
  TupleSyncResult,
} from "./interface";

/**
 * Local authorization provider.
 * Always permits all operations. Used in self-hosted mode.
 */
class LocalAuthzProvider implements AuthzProvider {
  async checkPermission(
    _userId: string,
    _resourceType: string,
    _resourceId: string,
    _permission: string,
    _requestCache?: Map<string, boolean>,
  ): Promise<boolean> {
    return true;
  }

  async checkPermissionsBatch(
    checks: PermissionCheck[],
    _requestCache?: Map<string, boolean>,
  ): Promise<PermissionCheckResult[]> {
    return checks.map((check) => ({ ...check, allowed: true }));
  }

  async writeTuples(
    _tuples: AuthzTuple[],
    _accessToken?: string,
  ): Promise<TupleSyncResult> {
    return { success: true };
  }

  async deleteTuples(
    _tuples: AuthzTuple[],
    _accessToken?: string,
  ): Promise<TupleSyncResult> {
    return { success: true };
  }

  invalidateCache(_pattern: string): void {
    // No-op
  }

  clearCache(): void {
    // No-op
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: "Local provider always healthy" };
  }
}

export { LocalAuthzProvider };
