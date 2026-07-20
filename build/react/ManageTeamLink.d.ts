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
 */
export declare const gatekeeperDashboardUrl: (identityBaseUrl: string) => string;
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
