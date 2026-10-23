/**
 * Client-safe entry for workspace-link normalization.
 *
 * Re-exports the pure helpers and types from `auth/workspaceLinks` without the
 * rest of the `auth` bundle (getAuth, OIDC, jose), so a browser consumer can
 * share the one canonical normalizer instead of re-implementing it, with no
 * Node-only code pulled into its client bundle.
 */
export { normalizeWorkspaceLinks, publicWorkspaceLinks, } from "../auth/workspaceLinks";
export type { WorkspaceLink, WorkspaceLinkVisibility } from "../auth/types";
