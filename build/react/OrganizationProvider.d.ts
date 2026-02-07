import type { PropsWithChildren } from "react";
import type { OrganizationClaim } from "../auth/types";
interface OrganizationContext {
    organizations: OrganizationClaim[];
    currentOrganization: OrganizationClaim;
    setCurrentOrganization: (orgId: string) => void;
    hasMultipleOrgs: boolean;
    /** Resolve organization details by ID. Returns undefined if not found */
    getOrganizationById: (orgId: string) => OrganizationClaim | undefined;
    /** True if organizations couldn't be loaded from IDP (degraded mode) */
    isDegradedMode: boolean;
}
declare const OrganizationContext: import("react").Context<OrganizationContext | null>;
/**
 * Global organization context provider.
 * Manages the current organization selection for multi-org users.
 *
 * When organizations array is empty (IDP unavailable or error), the
 * provider enters "degraded mode" which can be detected via
 * `isDegradedMode` flag.
 */
declare const OrganizationProvider: ({ children, organizations, }: PropsWithChildren<{
    organizations: OrganizationClaim[];
}>) => import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access organization context.
 * Returns null if used outside OrganizationProvider.
 */
declare const useOrganization: () => OrganizationContext | null;
export { OrganizationProvider, useOrganization };
