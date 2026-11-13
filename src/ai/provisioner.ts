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

/** Default cache window so each call does not re-provision the same user. */
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/** Aether app ids are lowercase slugs (mirrors synapse-api `productScope`). */
const APP_ID_RE = /^[a-z][a-z0-9-]{0,62}$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Entity types Aether bills (mirrors synapse-api `productScope`). */
const ENTITY_TYPES = ["user", "organization"] as const;

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
export class SynapseScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SynapseScopeError";
  }
}

/**
 * Thrown when provisioning fails. `status` is the HTTP status of a non-2xx
 * response, or `undefined` when the response was ok but carried no key
 */
export class SynapseProvisionError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SynapseProvisionError";
    this.status = status;
  }
}

interface CacheEntry {
  key: string;
  provisionedAt: number;
}

/** Optional user record fields forwarded to Synapse on provisioning. */
export interface SynapseUserMeta {
  email?: string;
  name?: string;
}

/** The subset of the provisioning response this reads. */
interface ProvisionResponse {
  apiKey?: string;
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
  resolveKey(
    identityProviderId: string,
    meta?: SynapseUserMeta,
    billingEntity?: SynapseBillingEntity,
  ): Promise<string>;
}

const isEntityType = (value: string): value is SynapseBillingEntityType =>
  (ENTITY_TYPES as readonly string[]).includes(value);

/** Validate a billing entity, mirroring synapse-api `parseProductScope`. */
const assertBillingEntity = (entity: SynapseBillingEntity): void => {
  if (!isEntityType(entity.entityType)) {
    throw new SynapseScopeError("billingEntity.entityType is not supported");
  }

  if (!UUID_RE.test(entity.entityId)) {
    throw new SynapseScopeError("billingEntity.entityId must be a UUID");
  }
};

/**
 * Create a per-user Synapse key provisioner bound to a provisioning API, gateway
 * secret, source label, and (optionally) the product's Aether `appId`. The
 * returned `resolveKey` caches each key per identity, app, and billing entity
 * for the TTL and throws on a provisioning failure (so the caller can fall back)
 */
export const createSynapseProvisioner = (
  config: SynapseProvisionerConfig,
): SynapseProvisioner => {
  const { appId } = config;

  if (appId !== undefined && !APP_ID_RE.test(appId)) {
    throw new SynapseScopeError("appId must be a lowercase slug");
  }

  const apiUrl = config.apiUrl.replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;
  const now = config.now ?? Date.now;
  const ttl = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cache = new Map<string, CacheEntry>();

  return {
    async resolveKey(
      identityProviderId: string,
      meta?: SynapseUserMeta,
      billingEntity?: SynapseBillingEntity,
    ): Promise<string> {
      if (billingEntity) {
        if (appId === undefined) {
          throw new SynapseScopeError("billingEntity requires appId");
        }
        assertBillingEntity(billingEntity);
      }

      // Key by identity, app, and the effective billing entity (the server
      // bills the user when a scoped call omits one) so entities never collide
      const effectiveEntity =
        appId === undefined
          ? null
          : (billingEntity ?? {
              entityType: "user",
              entityId: identityProviderId,
            });
      const cacheKey = JSON.stringify([
        identityProviderId,
        appId ?? null,
        effectiveEntity?.entityType ?? null,
        effectiveEntity?.entityId.toLowerCase() ?? null,
      ]);

      const cached = cache.get(cacheKey);
      if (cached && now() - cached.provisionedAt < ttl) {
        return cached.key;
      }

      const response = await doFetch(
        `${apiUrl}/internal/provision-managed-key`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-gateway-secret": config.gatewaySecret,
          },
          body: JSON.stringify({
            identityProviderId,
            source: config.source,
            ...(meta?.email && { email: meta.email }),
            ...(meta?.name && { name: meta.name }),
            ...(appId !== undefined && { appId }),
            ...(billingEntity && {
              billingEntity: {
                entityType: billingEntity.entityType,
                entityId: billingEntity.entityId,
              },
            }),
          }),
        },
      );

      if (!response.ok) {
        throw new SynapseProvisionError(
          `provision-managed-key failed: ${response.status}`,
          response.status,
        );
      }

      const data = (await response.json()) as ProvisionResponse;
      if (!data.apiKey) {
        throw new SynapseProvisionError(
          "provision-managed-key returned no apiKey",
        );
      }

      cache.set(cacheKey, { key: data.apiKey, provisionedAt: now() });
      return data.apiKey;
    },
  };
};
