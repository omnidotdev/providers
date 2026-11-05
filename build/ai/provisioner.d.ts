/**
 * Shared per-user Synapse managed-key provisioner.
 *
 * Synapse is the Omni AI gateway. A product can call it with one shared managed
 * key (usage billed to the product) or with a per-user key (usage attributed and
 * billed to each user's own Synapse account). This provisions and caches the
 * per-user key via Synapse's internal `POST {apiUrl}/internal/provision-managed-key`
 * endpoint, authorized by the fleet gateway secret.
 *
 * It replaces the per-product copies (facet-api, creator-api each hand-rolled an
 * identical client) so the fleet shares one implementation. `resolveKey` throws
 * on a provisioning failure so the caller can fall back to the shared key rather
 * than block; the caller's own credit ledger / budget still enforces the hard
 * cap, so a per-user key never widens the money-loss surface.
 *
 * Uses the global `fetch` (no SDK, no node imports) so it is trivially mockable
 */
/** Optional user record fields forwarded to Synapse on provisioning. */
export interface SynapseUserMeta {
    email?: string;
    name?: string;
}
export interface SynapseProvisionerConfig {
    /** Synapse provisioning API base URL (api.synapse, not the gateway), no trailing slash required. */
    apiUrl: string;
    /** Gateway secret authorizing the internal provisioning call. */
    gatewaySecret: string;
    /** Key label recorded on the provisioned Synapse key (the calling product, e.g. "Facet"). */
    source: string;
    /** Cache window in milliseconds, defaults to 5 minutes. */
    cacheTtlMs?: number;
    /** Injectable fetch, defaults to the global (for tests). */
    fetchImpl?: typeof fetch;
    /** Injectable clock, defaults to Date.now (for tests). */
    now?: () => number;
}
export interface SynapseProvisioner {
    /**
     * Resolve a per-user managed Synapse key for an identity-provider user id,
     * provisioning on demand and caching within the TTL. Throws on failure
     */
    resolveKey(identityProviderId: string, meta?: SynapseUserMeta): Promise<string>;
}
/**
 * Create a per-user Synapse key provisioner bound to a provisioning API, gateway
 * secret, and source label. The returned `resolveKey` caches each user's key for
 * the TTL and throws on a provisioning failure (so the caller can fall back)
 */
export declare const createSynapseProvisioner: (config: SynapseProvisionerConfig) => SynapseProvisioner;
