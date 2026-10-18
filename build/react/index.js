// src/react/accountUrl.ts
var accountUrl = (accountBaseUrl) => accountBaseUrl ? accountBaseUrl.replace(/\/+$/, "") : "";
// src/react/EventsProvider.tsx
import { createContext, use } from "react";
import { jsx } from "react/jsx-runtime";
var EventsContext = createContext(null);
var EventsProvider = ({
  children,
  provider
}) => {
  return /* @__PURE__ */ jsx(EventsContext, {
    value: provider,
    children
  });
};
var useEvents = () => {
  return use(EventsContext);
};
// src/react/ManageTeamLink.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var gatekeeperOrgManageUrl = (accountBaseUrl, orgSlug) => `${accountBaseUrl.replace(/\/+$/, "")}/@${orgSlug}`;
var gatekeeperDashboardUrl = (identityBaseUrl) => `${identityBaseUrl.replace(/\/+$/, "")}/dashboard`;
var ManageTeamLink = ({
  accountBaseUrl,
  orgSlug,
  className,
  children
}) => {
  if (!accountBaseUrl || !orgSlug)
    return null;
  return /* @__PURE__ */ jsx2("a", {
    href: gatekeeperOrgManageUrl(accountBaseUrl, orgSlug),
    target: "_blank",
    rel: "noopener noreferrer",
    className,
    children: children ?? "Manage team in Omni"
  });
};
// src/react/useCreateWorkspace.ts
import { useCallback, useState } from "react";

// src/auth/gatekeeperOrg.ts
var slugify = (name) => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

// src/react/useCreateWorkspace.ts
var createWorkspaceFlow = async ({
  name,
  slug,
  checkAvailability,
  createWorkspace,
  refreshSession
}) => {
  const resolvedSlug = slug?.trim() || slugify(name);
  if (checkAvailability) {
    const { available } = await checkAvailability(resolvedSlug);
    if (!available) {
      throw new Error(`The handle "${resolvedSlug}" is not available. Please choose a different one.`);
    }
  }
  const org = await createWorkspace({ name, slug: resolvedSlug });
  if (refreshSession) {
    try {
      await refreshSession();
    } catch {}
  }
  return org;
};
var useCreateWorkspace = ({
  checkAvailability,
  createWorkspace,
  refreshSession
}) => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const create = useCallback(async ({ name, slug }) => {
    setStatus("creating");
    setError(null);
    try {
      const org = await createWorkspaceFlow({
        name,
        slug,
        checkAvailability,
        createWorkspace,
        refreshSession
      });
      setStatus("done");
      return org;
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error("Failed to create workspace");
      setError(normalized);
      setStatus("error");
      throw normalized;
    }
  }, [checkAvailability, createWorkspace, refreshSession]);
  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);
  return {
    create,
    status,
    error,
    isCreating: status === "creating",
    reset
  };
};
// src/react/useSessionRefresh.ts
import { useEffect, useRef } from "react";
function useSessionRefresh(refreshFn, intervalMs = 4 * 60 * 1000) {
  const lastRefresh = useRef(Date.now());
  useEffect(() => {
    const refresh = () => {
      lastRefresh.current = Date.now();
      refreshFn();
    };
    const id = setInterval(refresh, intervalMs);
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible")
        return;
      const elapsed = Date.now() - lastRefresh.current;
      if (elapsed > intervalMs / 2) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshFn, intervalMs]);
}
// src/react/WorkspaceProvider.tsx
import { createContext as createContext2, use as use2, useMemo, useState as useState2 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var WorkspaceContext = createContext2(null);
function getDefaultWorkspace(workspaces) {
  const personalWorkspace = workspaces.find((w) => w.type === "personal");
  if (personalWorkspace)
    return personalWorkspace;
  return workspaces[0];
}
var WorkspaceProvider = ({
  children,
  workspaces
}) => {
  const isDegradedMode = workspaces.length === 0;
  const defaultWorkspace = useMemo(() => getDefaultWorkspace(workspaces), [workspaces]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState2(defaultWorkspace);
  const setCurrentWorkspace = (workspaceId) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace)
      setCurrentWorkspaceState(workspace);
  };
  const getWorkspaceById = (workspaceId) => {
    return workspaces.find((w) => w.id === workspaceId);
  };
  const hasMultipleWorkspaces = workspaces.length > 1;
  return /* @__PURE__ */ jsx3(WorkspaceContext, {
    value: {
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      hasMultipleWorkspaces,
      getWorkspaceById,
      isDegradedMode
    },
    children
  });
};
var useWorkspace = () => {
  return use2(WorkspaceContext);
};
export {
  EventsProvider,
  ManageTeamLink,
  WorkspaceProvider as OrganizationProvider,
  WorkspaceProvider,
  accountUrl,
  createWorkspaceFlow,
  gatekeeperDashboardUrl,
  gatekeeperOrgManageUrl,
  useCreateWorkspace,
  useEvents,
  useWorkspace as useOrganization,
  useSessionRefresh,
  useWorkspace
};
