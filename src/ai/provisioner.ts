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

/** Default cache window so each call does not re-provision the same user. */
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

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
  resolveKey(
    identityProviderId: string,
    meta?: SynapseUserMeta,
  ): Promise<string>;
}

/**
 * Create a per-user Synapse key provisioner bound to a provisioning API, gateway
 * secret, and source label. The returned `resolveKey` caches each user's key for
 * the TTL and throws on a provisioning failure (so the caller can fall back)
 */
export const createSynapseProvisioner = (
  config: SynapseProvisionerConfig,
): SynapseProvisioner => {
  const apiUrl = config.apiUrl.replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;
  const now = config.now ?? Date.now;
  const ttl = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cache = new Map<string, CacheEntry>();

  return {
    async resolveKey(
      identityProviderId: string,
      meta?: SynapseUserMeta,
    ): Promise<string> {
      const cached = cache.get(identityProviderId);
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
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`provision-managed-key failed: ${response.status}`);
      }

      const data = (await response.json()) as ProvisionResponse;
      if (!data.apiKey) {
        throw new Error("provision-managed-key returned no apiKey");
      }

      cache.set(identityProviderId, { key: data.apiKey, provisionedAt: now() });
      return data.apiKey;
    },
  };
};
