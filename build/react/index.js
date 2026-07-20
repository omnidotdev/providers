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
var gatekeeperOrgManageUrl = (identityBaseUrl, orgSlug) => `${identityBaseUrl.replace(/\/+$/, "")}/dashboard/organizations/${orgSlug}`;
var gatekeeperDashboardUrl = (identityBaseUrl) => `${identityBaseUrl.replace(/\/+$/, "")}/dashboard`;
var ManageTeamLink = ({
  identityBaseUrl,
  orgSlug,
  className,
  children
}) => {
  if (!identityBaseUrl || !orgSlug)
    return null;
  return /* @__PURE__ */ jsx2("a", {
    href: gatekeeperOrgManageUrl(identityBaseUrl, orgSlug),
    target: "_blank",
    rel: "noopener noreferrer",
    className,
    children: children ?? "Manage team in Omni"
  });
};
// src/react/OrganizationProvider.tsx
import { createContext as createContext2, use as use2, useMemo, useState } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var OrganizationContext = createContext2(null);
function getDefaultOrganization(organizations) {
  const personalOrg = organizations.find((org) => org.type === "personal");
  if (personalOrg)
    return personalOrg;
  return organizations[0];
}
var OrganizationProvider = ({
  children,
  organizations
}) => {
  const isDegradedMode = organizations.length === 0;
  const defaultOrg = useMemo(() => getDefaultOrganization(organizations), [organizations]);
  const [currentOrganization, setCurrentOrgState] = useState(defaultOrg);
  const setCurrentOrganization = (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org)
      setCurrentOrgState(org);
  };
  const getOrganizationById = (orgId) => {
    return organizations.find((o) => o.id === orgId);
  };
  const hasMultipleOrgs = organizations.length > 1;
  return /* @__PURE__ */ jsx3(OrganizationContext, {
    value: {
      organizations,
      currentOrganization,
      setCurrentOrganization,
      hasMultipleOrgs,
      getOrganizationById,
      isDegradedMode
    },
    children
  });
};
var useOrganization = () => {
  return use2(OrganizationContext);
};
// src/react/useCreateWorkspace.ts
import { useCallback, useState as useState2 } from "react";

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
  const [status, setStatus] = useState2("idle");
  const [error, setError] = useState2(null);
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
export {
  useSessionRefresh,
  useOrganization,
  useEvents,
  useCreateWorkspace,
  gatekeeperOrgManageUrl,
  gatekeeperDashboardUrl,
  createWorkspaceFlow,
  OrganizationProvider,
  ManageTeamLink,
  EventsProvider
};
