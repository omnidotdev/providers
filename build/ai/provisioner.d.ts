/**
 * Shared per-user Synapse managed-key provisioner.
 *
 * Synapse is the Omni AI gateway. A product can call it with one shared managed
 * key (usage billed to the product) or with a per-user key. This provisions and
 * caches the per-user key via Synapse's internal
 * `POST {apiUrl}/internal/provision-managed-key` endpoint, authorized by the
 * fleet gateway secret.
 *
 * Two kinds of per-user key exist:
 * - **Direct** (no `appId`): usage is metered and billed to the user's own
 *   Synapse account
 * - **Product-scoped** (`appId` set): usage is metered, entitlement-checked,
 *   and charged against the product's own Aether app, billed to a billing
 *   entity: the user themselves by default, or an explicit
 *   `{ entityType, entityId }` (e.g. the organization the user is acting in)
 *
 * The scope is validated locally with the same rules synapse-api enforces
 * (slug `appId`, `user` / `organization` entity type, UUID entity id, and no
 * entity without an `appId`), so a malformed or half-scoped request throws a
 * {@link SynapseScopeError} and never goes out. Keys are cached per identity,
 * app, and billing entity, so a user acting in two organizations never reuses
 * or clobbers the other organization's key.
 *
 * It replaces the per-product copies (facet-api, creator-api each hand-rolled an
 * identical client) so the fleet shares one implementation. `resolveKey` throws
 * a {@link SynapseProvisionError} (carrying the HTTP status) on a provisioning
 * failure so the caller can fall back to the shared key or map the status
 * (e.g. 403 when the `api_access` entitlement is revoked) onto its own UX.
 *
 * Uses the global `fetch` (no SDK, no node imports) so it is trivially mockable
 */
/** Entity types Aether bills (mirrors synapse-api `productScope`). */
declare const ENTITY_TYPES: readonly ["user", "organization"];
/** An entity type Aether can bill a product-scoped key to. */
export type SynapseBillingEntityType = (typeof ENTITY_TYPES)[number];
/**
 * The entity a product-scoped key bills within the product's Aether app.
 * `entityId` is the entity's UUID (identity-provider user id or organization id)
 */
export interface SynapseBillingEntity {
    entityType: SynapseBillingEntityType;
    entityId: string;
}
/**
 * Thrown before any request when a provisioning scope is invalid: a non-slug
 * `appId`, an unsupported entity type, a non-UUID entity id, or a billing
 * entity without an `appId`. Messages match synapse-api's 400 responses
 */
export declare class SynapseScopeError extends Error {
    constructor(message: string);
}
/**
 * Thrown when provisioning fails. `status` is the HTTP status of a non-2xx
 * response, or `undefined` when the response was ok but carried no key
 */
export declare class SynapseProvisionError extends Error {
    readonly status: number | undefined;
    constructor(message: string, status?: number);
}
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
    /**
     * The calling product's Aether app id (lowercase slug, e.g. "facet"). When
     * set, every key this provisioner resolves is product-scoped: the gateway
     * meters and charges it against this app instead of the user's own Synapse
     * account. Omit for direct Synapse keys. Throws a {@link SynapseScopeError}
     * at construction when not a slug
     */
    appId?: string;
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
     * provisioning on demand and caching within the TTL.
     *
     * `billingEntity` names the entity a product-scoped key bills (requires the
     * provisioner's `appId`); omitted, a product-scoped key bills the user
     * themselves. Throws a {@link SynapseScopeError} before any request on an
     * invalid scope, and a {@link SynapseProvisionError} on a provisioning failure
     */
    resolveKey(identityProviderId: string, meta?: SynapseUserMeta, billingEntity?: SynapseBillingEntity): Promise<string>;
}
/**
 * Create a per-user Synapse key provisioner bound to a provisioning API, gateway
 * secret, source label, and (optionally) the product's Aether `appId`. The
 * returned `resolveKey` caches each key per identity, app, and billing entity
 * for the TTL and throws on a provisioning failure (so the caller can fall back)
 */
export declare const createSynapseProvisioner: (config: SynapseProvisionerConfig) => SynapseProvisioner;
export {};
