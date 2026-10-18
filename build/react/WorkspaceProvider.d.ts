import type { PropsWithChildren } from "react";
import type { OrganizationClaim } from "../auth/types";
/**
 * Product-facing alias for the Better Auth / JWT wire type. The underlying
 * claim stays `OrganizationClaim` (the `claims/organizations` wire contract is
 * owned by identity and never renamed); "workspace" is the user-facing term
 */
type WorkspaceClaim = OrganizationClaim;
interface WorkspaceContext {
    workspaces: WorkspaceClaim[];
    currentWorkspace: WorkspaceClaim;
    setCurrentWorkspace: (workspaceId: string) => void;
    hasMultipleWorkspaces: boolean;
    /** Resolve workspace details by ID. Returns undefined if not found */
    getWorkspaceById: (workspaceId: string) => WorkspaceClaim | undefined;
    /** True if workspaces couldn't be loaded from IDP (degraded mode) */
    isDegradedMode: boolean;
}
declare const WorkspaceContext: import("react").Context<WorkspaceContext | null>;
/**
 * Global workspace context provider.
 * Manages the current workspace selection for multi-workspace users.
 *
 * When the workspaces array is empty (IDP unavailable or error), the
 * provider enters "degraded mode" which can be detected via
 * `isDegradedMode` flag.
 */
declare const WorkspaceProvider: ({ children, workspaces, }: PropsWithChildren<{
    workspaces: WorkspaceClaim[];
}>) => import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access workspace context.
 * Returns null if used outside WorkspaceProvider.
 */
declare const useWorkspace: () => WorkspaceContext | null;
export { WorkspaceProvider, useWorkspace };
export type { WorkspaceClaim };
