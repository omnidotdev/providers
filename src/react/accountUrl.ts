/**
 * Canonical Omni account-hub URL.
 *
 * The one place products link to for "manage account" (profile, security,
 * connected apps): the account hub at account.omni.dev, passed in as its base
 * URL so the host stays configurable per environment. Products link here
 * instead of inlining the account base, keeping the canonical location in a
 * single place, mirroring {@link gatekeeperDashboardUrl} for the identity
 * dashboard. Returns an empty string when no base is configured, so a missing
 * optional env degrades to an inert link rather than a thrown render
 */
export const accountUrl = (accountBaseUrl: string | undefined): string =>
  accountBaseUrl ? accountBaseUrl.replace(/\/+$/, "") : "";

/**
 * Canonical workspaces console URL on the account hub
 * (`${accountBaseUrl}/workspaces`).
 *
 * Creating and managing a workspace is an identity concern owned by ONE
 * surface: the account hub's workspaces console, which lists, creates, and
 * manages workspaces across the ecosystem. Products funnel users here instead
 * of shipping their own creation dialogs, so the flow, limits, and copy live in
 * one place and a change of destination happens here rather than in every app.
 * Returns an empty string when no base is configured, so a missing optional env
 * degrades to an inert link rather than a thrown render, mirroring
 * {@link accountUrl}.
 */
export const workspacesUrl = (accountBaseUrl: string | undefined): string =>
  accountBaseUrl ? `${accountBaseUrl.replace(/\/+$/, "")}/workspaces` : "";

/** Billing interval a hub plan purchase is for */
export type HubPlanInterval = "month" | "year";

/** A product plan to buy on the account hub */
export interface HubPlanParams {
  /** Product id as it appears in the omni-api catalog (e.g. "keystone") */
  product: string;
  /** Plan tier as the catalog names it (e.g. "pro", "team") */
  plan: string;
  /** Billing interval */
  interval: HubPlanInterval;
  /**
   * Workspace handle the plan is for. Omit to let the hub pick: the only
   * workspace the user owns or administers, or a choice among them
   */
  workspace?: string;
  /**
   * Where to come back to when checkout completes or is canceled, usually the
   * page the user left. The hub only follows a first-party Omni origin and
   * appends `checkout=success` or `checkout=canceled`
   */
  returnUrl?: string;
}

/** A workspace's plan to manage on the account hub */
export interface HubManageParams {
  /** Product id as it appears in the omni-api catalog (e.g. "keystone") */
  product: string;
  /** Workspace handle whose subscription to manage */
  workspace: string;
  /**
   * Where the billing portal returns to, usually the page the user left. The
   * hub only follows a first-party Omni origin
   */
  returnUrl?: string;
}

const hubBillingUrl = (
  accountBaseUrl: string | undefined,
  params: Record<string, string | undefined>,
): string => {
  const base = accountUrl(accountBaseUrl);
  if (!base) return "";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  return `${base}/billing?${search.toString()}`;
};

/**
 * Account hub URL to buy a product plan
 * (`${accountBaseUrl}/billing?product=&plan=&interval=&workspace=&return=`).
 *
 * The account hub is the one place plans are bought: a product shows its own
 * pricing, but its "Upgrade" action links here instead of running checkout
 * itself. One click lands on Stripe Checkout: the hub resolves the plan's
 * price from Aether, checks the user owns or administers the workspace,
 * creates the Checkout session server-side with its own billing-scoped token,
 * and redirects straight to it (signing the user in first when needed, with no
 * extra click). It stops on its own page only when it needs the user: several
 * workspaces and none named, a workspace the user cannot buy for, an unknown
 * plan, or a workspace that already has the plan (it opens plan management
 * instead). Checkout returns to `returnUrl` with `checkout=success` or
 * `checkout=canceled`. Ids are lowercased. Returns an empty string when no
 * base is configured, so a missing optional env degrades to an inert link,
 * mirroring {@link accountUrl}
 */
export const hubPlanUrl = (
  accountBaseUrl: string | undefined,
  { product, plan, interval, workspace, returnUrl }: HubPlanParams,
): string =>
  hubBillingUrl(accountBaseUrl, {
    product: product.toLowerCase(),
    plan: plan.toLowerCase(),
    interval,
    workspace: workspace?.toLowerCase(),
    return: returnUrl,
  });

/**
 * Account hub URL to manage a workspace's plan for a product
 * (`${accountBaseUrl}/billing?product=&workspace=&manage=1&return=`).
 *
 * One click lands on the product's billing portal for that workspace (change
 * or cancel the plan, payment method, invoices), returning to `returnUrl`. Use
 * it for every "Manage billing" or "Manage subscription" action instead of
 * opening the portal from the product. Ids are lowercased. Returns an empty
 * string when no base is configured, mirroring {@link accountUrl}
 */
export const hubManageUrl = (
  accountBaseUrl: string | undefined,
  { product, workspace, returnUrl }: HubManageParams,
): string =>
  hubBillingUrl(accountBaseUrl, {
    product: product.toLowerCase(),
    workspace: workspace.toLowerCase(),
    manage: "1",
    return: returnUrl,
  });

/** Omni credits to buy on the account hub */
export interface HubCreditsParams {
  /**
   * Product the user is buying from (catalog id, e.g. "facet"); names the
   * receipt. Credits themselves are shared across every Omni product
   */
  product?: string;
  /**
   * Workspace handle whose balance the credits fund. Omit for the user's
   * personal account
   */
  workspace?: string;
  /**
   * Credit pack id (Aether's `GET /account/credit-packs`, e.g.
   * "credits-2000") to go straight to Stripe Checkout for. Omit to let the
   * user pick a pack on the hub
   */
  pack?: string;
}

/**
 * Account hub URL to buy Omni credits
 * (`${accountBaseUrl}/billing?product=&workspace=&pack=`).
 *
 * With a `pack`, one click lands on Stripe Checkout for it, for the linked
 * workspace (which the user must own or administer) or their personal
 * account; without one, the hub's AI usage tab shows the balance and the
 * packs to choose from. Checkout returns to the hub with the new balance. Ids
 * are lowercased. Returns an empty string when no base is configured,
 * mirroring {@link accountUrl}
 */
export const hubCreditsUrl = (
  accountBaseUrl: string | undefined,
  { product, workspace, pack }: HubCreditsParams = {},
): string =>
  hubBillingUrl(accountBaseUrl, {
    product: product?.toLowerCase(),
    workspace: workspace?.toLowerCase(),
    pack: pack?.toLowerCase(),
    ...(pack ? {} : { tab: "ai" }),
  });
