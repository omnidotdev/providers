export interface ArborConfig {
  appUrl: string;
}

export interface ArborConnection {
  /** Public URL for a repo, e.g. https://arbor.omni.dev/@owner/repo */
  linkOut(ownerHandle: string, repoSlug: string): string;
}

/**
 * Arbor (graph-based git hosting) connection. v1 is a link-out only: a repo
 * showcase card links to the public repo. Arbor is graph-first (no social
 * stars); its `Repository` exposes name/description/visibility/owner and an
 * `externalDependencies` graph.
 *
 * Live enrichment (description + dependency count via Arbor's GraphQL) is a
 * follow-up. The read path is confirmed against arbor-api's schema, so wiring it
 * is mechanical: add `ARBOR_API_URL` + an injected GraphQL transport, then query
 *   repositories(filter: { slug: { equalTo: $repo }, visibility: { equalTo: public } }, first: 10) {
 *     nodes { name slug description owner { username } externalDependencies { totalCount } }
 *   }
 * and pick the node whose `owner.username` matches (slug is not globally unique).
 * `externalDependencies.totalCount` is the dependency-graph count to show on the
 * card. Deferred here because the static-site card would need either build-time
 * baking or a runtime enrichment round-trip, both of which want a running server
 * to verify. Keep it fail-soft: any miss falls back to the link-out below.
 */
export const createArborConnection = (
  config: ArborConfig,
): ArborConnection => ({
  linkOut: (ownerHandle, repoSlug) =>
    `${config.appUrl}/@${ownerHandle.replace(/^@/, "")}/${repoSlug}`,
});
