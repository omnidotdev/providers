import type { AuthzProvider, AuthzTuple, PermissionCheck, PermissionCheckResult, TupleSyncResult } from "./interface";
/**
 * Local authorization provider.
 * Always permits all operations. Used in self-hosted mode.
 */
declare class LocalAuthzProvider implements AuthzProvider {
    checkPermission(_userId: string, _resourceType: string, _resourceId: string, _permission: string, _requestCache?: Map<string, boolean>): Promise<boolean>;
    checkPermissionsBatch(checks: PermissionCheck[], _requestCache?: Map<string, boolean>): Promise<PermissionCheckResult[]>;
    writeTuples(_tuples: AuthzTuple[], _accessToken?: string): Promise<TupleSyncResult>;
    deleteTuples(_tuples: AuthzTuple[], _accessToken?: string): Promise<TupleSyncResult>;
    invalidateCache(_pattern: string): void;
    clearCache(): void;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export { LocalAuthzProvider };
