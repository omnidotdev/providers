/**
 * Minimal actor identity an audit/activity consumer needs to attribute an
 * action. Structurally satisfied by each service's user row, so producers can
 * pass their observer directly without a mapping step.
 */
export interface EventActor {
  id: string;
  identityProviderId: string;
  name: string;
  email: string;
}

/**
 * Build the actor and resource metadata that audit/activity consumers (e.g.
 * Chronicle) need to render "who did what to which thing" records, merged into
 * an event's `data` payload.
 *
 * Actor identity is derived from the request observer; system events (no
 * observer) omit the actor fields. `resourceName` is omitted when unavailable so
 * it never serializes as an explicit null.
 */
export const eventMeta = (
  observer: EventActor | null,
  resourceType: string,
  resourceName?: string | null,
) => ({
  resourceType,
  ...(resourceName != null ? { resourceName } : {}),
  ...(observer
    ? {
        actorId: observer.id,
        actorIdpId: observer.identityProviderId,
        actorName: observer.name,
        actorEmail: observer.email,
      }
    : {}),
});
