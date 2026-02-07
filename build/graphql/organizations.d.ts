import type { Plugin } from "@envelop/types";
import type { OrganizationClaim } from "../auth/types";
type OrganizationsPluginConfig = {
    getOrganizationClaimsFromCache: (accessToken: string) => OrganizationClaim[];
};
/**
 * Create a plugin that extracts organization claims from cached userinfo.
 * Must run after the authentication plugin that fetches userinfo.
 *
 * Adds `organizations` to the GraphQL context for use in authorization.
 * @param config - Config with cache accessor function
 */
declare const createOrganizationsPlugin: (config: OrganizationsPluginConfig) => Plugin;
export { createOrganizationsPlugin };
export type { OrganizationsPluginConfig };
