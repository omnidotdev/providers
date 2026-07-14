import type { NamespaceAvailability } from "../auth/gatekeeperOrg";
export type { NamespaceAvailability };
export interface CreateWorkspaceFlowParams<TOrg> {
    /** Human-readable workspace (organization) name */
    name: string;
    /** Optional explicit slug/handle; derived from `name` when omitted */
    slug?: string;
    /**
     * Check whether a slug is free across the ecosystem-global namespace.
     * Skipped when not provided (e.g. transport validates server-side).
     */
    checkAvailability?: (slug: string) => Promise<NamespaceAvailability>;
    /**
     * Transport that actually creates the organization. Injected per mount:
     * the IdP wires the browser auth client; other products wire a server fn
     * (the `gatekeeperOrg` client must run server-side, so products cannot call
     * it from the browser).
     */
    createWorkspace: (input: {
        name: string;
        slug: string;
    }) => Promise<TOrg>;
    /**
     * Refresh the session so the freshly created org lands in the JWT claims.
     * Typically the app's `fetchSession`. Failures are swallowed since the org
     * has already been created.
     */
    refreshSession?: () => void | Promise<unknown>;
}
/**
 * Orchestrate workspace (organization) creation, transport-agnostic.
 *
 * The ecosystem-wide creation flow lives here, once: derive the slug, gate on
 * namespace availability, create via the injected transport, then refresh the
 * session so the new org appears in the JWT claims. Keeping this pure (no React,
 * no hardcoded transport) lets both the IdP (same-origin) and every product
 * (server-fn) reuse a single implementation, and makes it unit-testable.
 */
export declare const createWorkspaceFlow: <TOrg>({ name, slug, checkAvailability, createWorkspace, refreshSession, }: CreateWorkspaceFlowParams<TOrg>) => Promise<TOrg>;
/** Discriminated state of the create-workspace hook */
export type CreateWorkspaceStatus = "idle" | "creating" | "done" | "error";
export interface UseCreateWorkspaceResult<TOrg> {
    create: (params: {
        name: string;
        slug?: string;
    }) => Promise<TOrg | undefined>;
    status: CreateWorkspaceStatus;
    error: Error | null;
    isCreating: boolean;
    reset: () => void;
}
export type UseCreateWorkspaceOptions<TOrg> = Pick<CreateWorkspaceFlowParams<TOrg>, "checkAvailability" | "createWorkspace" | "refreshSession">;
/**
 * React binding over {@link createWorkspaceFlow}: tracks status/error and
 * exposes a stable `create`. Products supply the transport callbacks; the
 * styled dialog is thin markup over this hook (see design doc).
 */
export declare const useCreateWorkspace: <TOrg>({ checkAvailability, createWorkspace, refreshSession, }: UseCreateWorkspaceOptions<TOrg>) => UseCreateWorkspaceResult<TOrg>;
