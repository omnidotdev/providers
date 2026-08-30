import type { ReactNode } from "react";
/**
 * Canonical Gatekeeper org-management URL.
 *
 * Org/workspace membership (invite, remove, change role, pending invitations)
 * is managed centrally at Gatekeeper, so products deep-link here instead of
 * re-implementing management UIs. This is the single source for the URL pattern.
 */
export declare const gatekeeperOrgManageUrl: (identityBaseUrl: string, orgSlug: string) => string;
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
export declare const gatekeeperDashboardUrl: (identityBaseUrl: string) => string;
/**
 * Canonical account-management URL. Products MUST link here for "manage
 * account" instead of inlining `${identityBaseUrl}/dashboard` or a console URL,
 * so the account host can move without touching every app. Pass the app's
 * `ACCOUNT_BASE_URL` (env `VITE_ACCOUNT_URL`).
 */
export declare const accountUrl: (accountBaseUrl: string) => string;
export interface ManageTeamLinkProps {
    /** Gatekeeper base URL, e.g. https://identity.omni.dev */
    identityBaseUrl: string;
    /** Organization slug whose team to manage */
    orgSlug: string;
    /** App-specific styling */
    className?: string;
    /** Override the default label */
    children?: ReactNode;
}
/**
 * Deep-link to the centralized Gatekeeper team-management dashboard.
 *
 * Team membership management lives at Gatekeeper (the shared IDP), not in each
 * product. This headless, dependency-free link is the standard in-product entry
 * point so products funnel consistently instead of shipping drifting invite UIs.
 * Renders nothing when the base URL or slug is missing.
 */
export declare const ManageTeamLink: ({ identityBaseUrl, orgSlug, className, children, }: ManageTeamLinkProps) => import("react/jsx-runtime").JSX.Element | null;
