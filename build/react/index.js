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
var withLoginHint = (url, loginHint) => {
  if (!url || !loginHint)
    return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${new URLSearchParams({ login_hint: loginHint })}`;
};
var accountUrl = (accountBaseUrl, { loginHint } = {}) => withLoginHint(accountBaseUrl ? accountBaseUrl.replace(/\/+$/, "") : "", loginHint);
var workspacesUrl = (accountBaseUrl, { loginHint } = {}) => withLoginHint(accountBaseUrl ? `${accountBaseUrl.replace(/\/+$/, "")}/workspaces` : "", loginHint);
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
var hubPlanUrl = (accountBaseUrl, { product, plan, interval, workspace, returnUrl, loginHint }) => hubBillingUrl(accountBaseUrl, {
  product: product.toLowerCase(),
  plan: plan.toLowerCase(),
  interval,
  workspace: workspace?.toLowerCase(),
  return: returnUrl,
  login_hint: loginHint ?? undefined
});
var hubManageUrl = (accountBaseUrl, { product, workspace, returnUrl, loginHint }) => hubBillingUrl(accountBaseUrl, {
  product: product.toLowerCase(),
  workspace: workspace.toLowerCase(),
  manage: "1",
  return: returnUrl,
  login_hint: loginHint ?? undefined
});
var hubCreditsUrl = (accountBaseUrl, { product, workspace, pack, loginHint } = {}) => hubBillingUrl(accountBaseUrl, {
  product: product?.toLowerCase(),
  workspace: workspace?.toLowerCase(),
  pack: pack?.toLowerCase(),
  ...pack ? {} : { tab: "ai" },
  login_hint: loginHint ?? undefined
});
var hubInvoicesUrl = (accountBaseUrl, { workspace, loginHint } = {}) => hubBillingUrl(accountBaseUrl, {
  workspace: workspace?.toLowerCase(),
  tab: "invoices",
  login_hint: loginHint ?? undefined
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
// src/react/useIdentitySync.ts
import { useEffect, useRef } from "react";
var checkIdentity = async (authBaseUrl, subject, fetchImpl = fetch) => {
  try {
    const res = await fetchImpl(`${authBaseUrl.replace(/\/+$/, "")}/api/session/current`, { credentials: "include", cache: "no-store" });
    if (res.status === 401)
      return "signed-out";
    if (!res.ok)
      return "unknown";
    const body = await res.json();
    const sub = body.data?.sub;
    if (typeof sub !== "string" || !sub)
      return "unknown";
    return sub === subject ? "same" : "switched";
  } catch {
    return "unknown";
  }
};
var ACTED_KEY = "omni.identitySync.acted";
var ACT_COOLDOWN_MS = 60 * 1000;
var recentlyActed = (subject) => {
  try {
    const [actedFor, at] = (sessionStorage.getItem(ACTED_KEY) ?? "").split("|");
    return actedFor === subject && Date.now() - Number(at) < ACT_COOLDOWN_MS;
  } catch {
    return false;
  }
};
var markActed = (subject) => {
  try {
    sessionStorage.setItem(ACTED_KEY, `${subject}|${Date.now()}`);
  } catch {}
};
function useIdentitySync({
  authBaseUrl,
  subject,
  onSignedOut,
  onSwitched,
  intervalMs = 5 * 60 * 1000
}) {
  const callbacks = useRef({ onSignedOut, onSwitched });
  callbacks.current = { onSignedOut, onSwitched };
  useEffect(() => {
    if (!authBaseUrl || !subject)
      return;
    let isActing = false;
    let lastCheck = 0;
    const check = async () => {
      if (isActing || document.visibilityState !== "visible")
        return;
      if (Date.now() - lastCheck < 30 * 1000)
        return;
      lastCheck = Date.now();
      const result = await checkIdentity(authBaseUrl, subject);
      if (result !== "switched" && result !== "signed-out")
        return;
      if (recentlyActed(subject))
        return;
      isActing = true;
      markActed(subject);
      await (result === "switched" ? callbacks.current.onSwitched() : callbacks.current.onSignedOut());
    };
    check();
    const id = setInterval(check, intervalMs);
    const onVisibilityChange = () => void check();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authBaseUrl, subject, intervalMs]);
}
// src/react/useRememberedAccounts.ts
import { useEffect as useEffect2, useState as useState2 } from "react";
var isRememberedAccount = (value) => {
  const account = value;
  return typeof account?.handle === "string" && account.handle.length > 0;
};
var fetchRememberedAccounts = async (authBaseUrl, fetchImpl = fetch) => {
  try {
    const res = await fetchImpl(`${authBaseUrl.replace(/\/+$/, "")}/api/session/accounts`, { credentials: "include", cache: "no-store" });
    if (!res.ok)
      return [];
    const body = await res.json();
    const accounts = body.data?.accounts;
    if (!Array.isArray(accounts))
      return [];
    return accounts.filter(isRememberedAccount).map((account) => ({
      handle: account.handle,
      name: account.name ?? null,
      email: account.email ?? null,
      image: account.image ?? null
    }));
  } catch {
    return [];
  }
};
var otherRememberedAccounts = (accounts, currentEmail) => {
  const current = currentEmail?.trim().toLowerCase();
  return accounts.filter((account) => !current || account.email?.trim().toLowerCase() !== current);
};
function useRememberedAccounts({
  authBaseUrl,
  enabled = true
}) {
  const [accounts, setAccounts] = useState2([]);
  useEffect2(() => {
    if (!authBaseUrl || !enabled) {
      setAccounts([]);
      return;
    }
    let isCurrent = true;
    let lastLookup = 0;
    const lookUp = async () => {
      if (document.visibilityState !== "visible")
        return;
      if (Date.now() - lastLookup < 30 * 1000)
        return;
      lastLookup = Date.now();
      const next = await fetchRememberedAccounts(authBaseUrl);
      if (isCurrent)
        setAccounts(next);
    };
    lookUp();
    const onVisibilityChange = () => void lookUp();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      isCurrent = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authBaseUrl, enabled]);
  return accounts;
}
// src/react/useSessionRefresh.ts
import { useEffect as useEffect3, useRef as useRef2 } from "react";
function useSessionRefresh(refreshFn, intervalMs = 4 * 60 * 1000) {
  const lastRefresh = useRef2(Date.now());
  useEffect3(() => {
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
import { createContext as createContext2, use as use2, useMemo, useState as useState3 } from "react";
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
  const [currentWorkspace, setCurrentWorkspaceState] = useState3(defaultWorkspace);
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
  checkIdentity,
  createWorkspaceFlow,
  fetchRememberedAccounts,
  gatekeeperOrgManageUrl,
  hubCreditsUrl,
  hubInvoicesUrl,
  hubManageUrl,
  hubPlanUrl,
  otherRememberedAccounts,
  useCreateWorkspace,
  useEvents,
  useIdentitySync,
  useWorkspace as useOrganization,
  useRememberedAccounts,
  useSessionRefresh,
  useWorkspace,
  workspacesUrl
};
