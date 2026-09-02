import type { ReactNode } from "react";

/**
 * Canonical org-management URL.
 *
 * Org/workspace membership (invite, remove, change role, pending invitations)
 * is an identity concern managed in ONE place: the account hub (backed by
 * Gatekeeper). Products deep-link here instead of re-implementing management
 * UIs. This is the single source for the URL pattern; a change of destination
 * happens here, not in every app.
 *
 * Pass the app's `ACCOUNT_BASE_URL` (env `VITE_ACCOUNT_URL`), NOT the identity
 * URL: the account hub, not Gatekeeper's issuer, owns this surface.
 */
export const gatekeeperOrgManageUrl = (
  accountBaseUrl: string,
  orgSlug: string,
): string => `${accountBaseUrl.replace(/\/+$/, "")}/organizations/${orgSlug}`;

/**
 * Canonical Gatekeeper account/organization dashboard URL.
 *
 * The slug-less counterpart to {@link gatekeeperOrgManageUrl}: where a product
 * sends users to list, create, or join organizations (no single org in scope).
 * Products should link here instead of inlining `${identityBaseUrl}/dashboard`.
 *
 * For the "manage account" surface, use {@link accountUrl} instead; this helper
 * remains only for org-management deep links for now.
 */
export const gatekeeperDashboardUrl = (identityBaseUrl: string): string =>
  `${identityBaseUrl.replace(/\/+$/, "")}/dashboard`;

/**
 * Canonical account-management URL. Products MUST link here for "manage
 * account" instead of inlining `${identityBaseUrl}/dashboard` or a console URL,
 * so the account host can move without touching every app. Pass the app's
 * `ACCOUNT_BASE_URL` (env `VITE_ACCOUNT_URL`).
 */
export const accountUrl = (accountBaseUrl: string): string =>
  accountBaseUrl.replace(/\/+$/, "");

export interface ManageTeamLinkProps {
  /** Account hub base URL, e.g. https://account.omni.dev (env VITE_ACCOUNT_URL) */
  accountBaseUrl: string;
  /** Organization slug whose team to manage */
  orgSlug: string;
  /** App-specific styling */
  className?: string;
  /** Override the default label */
  children?: ReactNode;
}

/**
 * Deep-link to the centralized team-management surface on the account hub.
 *
 * Team membership management lives in one place (the account hub, backed by the
 * shared IDP), not in each product. This headless, dependency-free link is the
 * standard in-product entry point so products funnel consistently instead of
 * shipping drifting invite UIs. Renders nothing when the base URL or slug is
 * missing.
 */
export const ManageTeamLink = ({
  accountBaseUrl,
  orgSlug,
  className,
  children,
}: ManageTeamLinkProps) => {
  if (!accountBaseUrl || !orgSlug) return null;

  return (
    <a
      href={gatekeeperOrgManageUrl(accountBaseUrl, orgSlug)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children ?? "Manage team in Omni"}
    </a>
  );
};
