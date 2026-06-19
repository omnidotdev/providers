import type { WardenRelation, WardenResourceType } from "./relations";

/**
 * Authorization tuple for relationship-based access control.
 */
type AuthzTuple = {
  user: string;
  relation: string;
  object: string;
};

/**
 * Result of a tuple write/delete operation.
 */
type TupleSyncResult = { success: true } | { success: false; error: string };

/**
 * Permission check request for batch operations.
 *
 * A distributive union over resource types: each member pairs a `resourceType`
 * with the `permission` relations valid for that type, so an invalid pairing
 * (e.g. `viewer` on `organization`) fails to type-check.
 */
type PermissionCheck = {
  [T in WardenResourceType]: {
    userId: string;
    resourceType: T;
    resourceId: string;
    permission: WardenRelation<T>;
  };
}[WardenResourceType];

/**
 * Permission check result from batch operations.
 */
type PermissionCheckResult = PermissionCheck & {
  allowed: boolean;
};

/**
 * Authorization provider interface.
 * Implementations check if a user has permission on a resource.
 */
interface AuthzProvider {
  /**
   * Check if a user has permission on a resource.
   * @param userId - The user ID
   * @param resourceType - The type of resource (e.g., "organization", "project")
   * @param resourceId - The resource ID
   * @param permission - The relation to check, constrained to the relations
   *   valid for `resourceType` in Warden's model (e.g. "admin" on "organization")
   * @param requestCache - Optional request-scoped cache to avoid N+1
   * @returns true if authorized, false otherwise
   */
  checkPermission<T extends WardenResourceType>(
    userId: string,
    resourceType: T,
    resourceId: string,
    permission: WardenRelation<T>,
    requestCache?: Map<string, boolean>,
  ): Promise<boolean>;

  /**
   * Batch check multiple permissions in a single API call.
   * Reduces N+1 queries when checking permissions on multiple resources.
   */
  checkPermissionsBatch?(
    checks: PermissionCheck[],
    requestCache?: Map<string, boolean>,
  ): Promise<PermissionCheckResult[]>;

  /**
   * Write authorization tuples to the authz system.
   * Used after mutations to sync state.
   */
  writeTuples?(
    tuples: AuthzTuple[],
    accessToken?: string,
  ): Promise<TupleSyncResult>;

  /**
   * Delete authorization tuples from the authz system.
   */
  deleteTuples?(
    tuples: AuthzTuple[],
    accessToken?: string,
  ): Promise<TupleSyncResult>;

  /**
   * Invalidate cached permissions matching a pattern.
   */
  invalidateCache?(pattern: string): void;

  /** Clear all cached permissions */
  clearCache?(): void;

  /** Health check for the provider */
  healthCheck?(): Promise<{ healthy: boolean; message?: string }>;

  /** Close the provider connection (if stateful) */
  close?(): Promise<void>;
}

export type {
  AuthzProvider,
  AuthzTuple,
  PermissionCheck,
  PermissionCheckResult,
  TupleSyncResult,
};
