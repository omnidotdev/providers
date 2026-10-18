import { createContext, use, useMemo, useState } from "react";

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

const WorkspaceContext = createContext<WorkspaceContext | null>(null);

/**
 * Get the default workspace from the list.
 * Priority: personal workspace first, then first available workspace.
 */
function getDefaultWorkspace(workspaces: WorkspaceClaim[]): WorkspaceClaim {
  const personalWorkspace = workspaces.find((w) => w.type === "personal");
  if (personalWorkspace) return personalWorkspace;
  return workspaces[0];
}

/**
 * Global workspace context provider.
 * Manages the current workspace selection for multi-workspace users.
 *
 * When the workspaces array is empty (IDP unavailable or error), the
 * provider enters "degraded mode" which can be detected via
 * `isDegradedMode` flag.
 */
const WorkspaceProvider = ({
  children,
  workspaces,
}: PropsWithChildren<{
  workspaces: WorkspaceClaim[];
}>) => {
  const isDegradedMode = workspaces.length === 0;

  const defaultWorkspace = useMemo(
    () => getDefaultWorkspace(workspaces),
    [workspaces],
  );

  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<WorkspaceClaim>(defaultWorkspace);

  const setCurrentWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) setCurrentWorkspaceState(workspace);
  };

  const getWorkspaceById = (workspaceId: string) => {
    return workspaces.find((w) => w.id === workspaceId);
  };

  const hasMultipleWorkspaces = workspaces.length > 1;

  return (
    <WorkspaceContext
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        hasMultipleWorkspaces,
        getWorkspaceById,
        isDegradedMode,
      }}
    >
      {children}
    </WorkspaceContext>
  );
};

/**
 * Hook to access workspace context.
 * Returns null if used outside WorkspaceProvider.
 */
const useWorkspace = () => {
  return use(WorkspaceContext);
};

export { WorkspaceProvider, useWorkspace };
export type { WorkspaceClaim };
