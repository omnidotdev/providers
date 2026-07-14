import { useCallback, useState } from "react";

import { slugify } from "../auth/gatekeeperOrg";

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
  createWorkspace: (input: { name: string; slug: string }) => Promise<TOrg>;
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
export const createWorkspaceFlow = async <TOrg>({
  name,
  slug,
  checkAvailability,
  createWorkspace,
  refreshSession,
}: CreateWorkspaceFlowParams<TOrg>): Promise<TOrg> => {
  const resolvedSlug = slug?.trim() || slugify(name);

  if (checkAvailability) {
    const { available } = await checkAvailability(resolvedSlug);

    if (!available) {
      throw new Error(
        `The handle "${resolvedSlug}" is not available. Please choose a different one.`,
      );
    }
  }

  const org = await createWorkspace({ name, slug: resolvedSlug });

  if (refreshSession) {
    try {
      await refreshSession();
    } catch {
      // The org was created; a stale session self-heals on the next refresh
      // (see useSessionRefresh). Do not fail the create over it.
    }
  }

  return org;
};

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

export type UseCreateWorkspaceOptions<TOrg> = Pick<
  CreateWorkspaceFlowParams<TOrg>,
  "checkAvailability" | "createWorkspace" | "refreshSession"
>;

/**
 * React binding over {@link createWorkspaceFlow}: tracks status/error and
 * exposes a stable `create`. Products supply the transport callbacks; the
 * styled dialog is thin markup over this hook (see design doc).
 */
export const useCreateWorkspace = <TOrg>({
  checkAvailability,
  createWorkspace,
  refreshSession,
}: UseCreateWorkspaceOptions<TOrg>): UseCreateWorkspaceResult<TOrg> => {
  const [status, setStatus] = useState<CreateWorkspaceStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async ({ name, slug }: { name: string; slug?: string }) => {
      setStatus("creating");
      setError(null);

      try {
        const org = await createWorkspaceFlow({
          name,
          slug,
          checkAvailability,
          createWorkspace,
          refreshSession,
        });

        setStatus("done");

        return org;
      } catch (err) {
        const normalized =
          err instanceof Error ? err : new Error("Failed to create workspace");
        setError(normalized);
        setStatus("error");

        throw normalized;
      }
    },
    [checkAvailability, createWorkspace, refreshSession],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return {
    create,
    status,
    error,
    isCreating: status === "creating",
    reset,
  };
};
