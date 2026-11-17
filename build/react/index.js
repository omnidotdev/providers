// src/billing/accountCredit.ts
var formatMinorAmount = (amount, currency, locale) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase()
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
};
var accountCreditDisplay = (accountCredit, locale) => {
  if (!accountCredit || typeof accountCredit.currency !== "string") {
    return { kind: "none" };
  }
  const { credit, due, currency } = accountCredit;
  const kind = Number.isFinite(credit) && credit > 0 ? "credit" : Number.isFinite(due) && due > 0 ? "due" : null;
  if (!kind)
    return { kind: "none" };
  const amount = kind === "credit" ? credit : due;
  try {
    return {
      kind,
      amount,
      currency,
      label: formatMinorAmount(amount, currency, locale)
    };
  } catch {
    return { kind: "none" };
  }
};

// src/react/AccountCreditNotice.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var AccountCreditNotice = ({
  accountCredit,
  invoicesUrl,
  locale,
  className,
  linkClassName
}) => {
  const display = accountCreditDisplay(accountCredit, locale);
  if (display.kind === "none" && !invoicesUrl)
    return null;
  return /* @__PURE__ */ jsxs("p", {
    className,
    "data-account-credit": display.kind,
    children: [
      display.kind === "credit" && /* @__PURE__ */ jsxs("span", {
        children: [
          "Account credit: ",
          /* @__PURE__ */ jsx("strong", {
            children: display.label
          }),
          ", applied to your next invoice."
        ]
      }),
      display.kind === "due" && /* @__PURE__ */ jsxs("span", {
        children: [
          "Balance due: ",
          /* @__PURE__ */ jsx("strong", {
            children: display.label
          }),
          ", added to your next invoice."
        ]
      }),
      display.kind !== "none" && invoicesUrl && " ",
      invoicesUrl && /* @__PURE__ */ jsx("a", {
        href: invoicesUrl,
        className: linkClassName,
        children: "Invoices"
      })
    ]
  });
};
// src/react/accountUrl.ts
var accountUrl = (accountBaseUrl) => accountBaseUrl ? accountBaseUrl.replace(/\/+$/, "") : "";
var workspacesUrl = (accountBaseUrl) => accountBaseUrl ? `${accountBaseUrl.replace(/\/+$/, "")}/workspaces` : "";
var hubBillingUrl = (accountBaseUrl, params) => {
  const base = accountUrl(accountBaseUrl);
  if (!base)
    return "";
  const search = new URLSearchParams;
  for (const [key, value] of Object.entries(params)) {
    if (value)
      search.set(key, value);
  }
  return `${base}/billing?${search.toString()}`;
};
var hubPlanUrl = (accountBaseUrl, { product, plan, interval, workspace, returnUrl }) => hubBillingUrl(accountBaseUrl, {
  product: product.toLowerCase(),
  plan: plan.toLowerCase(),
  interval,
  workspace: workspace?.toLowerCase(),
  return: returnUrl
});
var hubManageUrl = (accountBaseUrl, { product, workspace, returnUrl }) => hubBillingUrl(accountBaseUrl, {
  product: product.toLowerCase(),
  workspace: workspace.toLowerCase(),
  manage: "1",
  return: returnUrl
});
var hubCreditsUrl = (accountBaseUrl, { product, workspace, pack } = {}) => hubBillingUrl(accountBaseUrl, {
  product: product?.toLowerCase(),
  workspace: workspace?.toLowerCase(),
  pack: pack?.toLowerCase(),
  ...pack ? {} : { tab: "ai" }
});
var hubInvoicesUrl = (accountBaseUrl, { workspace } = {}) => hubBillingUrl(accountBaseUrl, {
  workspace: workspace?.toLowerCase(),
  tab: "invoices"
});
// src/react/EventsProvider.tsx
import { createContext, use } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var EventsContext = createContext(null);
var EventsProvider = ({
  children,
  provider
}) => {
  return /* @__PURE__ */ jsx2(EventsContext, {
    value: provider,
    children
  });
};
var useEvents = () => {
  return use(EventsContext);
};
// src/react/ManageTeamLink.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var gatekeeperOrgManageUrl = (accountBaseUrl, orgSlug) => `${accountBaseUrl.replace(/\/+$/, "")}/@${orgSlug}`;
var ManageTeamLink = ({
  accountBaseUrl,
  orgSlug,
  className,
  children
}) => {
  if (!accountBaseUrl || !orgSlug)
    return null;
  return /* @__PURE__ */ jsx3("a", {
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
import { jsx as jsx4 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx4(WorkspaceContext, {
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
  AccountCreditNotice,
  EventsProvider,
  ManageTeamLink,
  WorkspaceProvider as OrganizationProvider,
  WorkspaceProvider,
  accountUrl,
  createWorkspaceFlow,
  gatekeeperOrgManageUrl,
  hubCreditsUrl,
  hubInvoicesUrl,
  hubManageUrl,
  hubPlanUrl,
  useCreateWorkspace,
  useEvents,
  useWorkspace as useOrganization,
  useSessionRefresh,
  useWorkspace,
  workspacesUrl
};
