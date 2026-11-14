// src/ai/provisioner.ts
var DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
var APP_ID_RE = /^[a-z][a-z0-9-]{0,62}$/;
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var ENTITY_TYPES = ["user", "organization"];

class SynapseScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = "SynapseScopeError";
  }
}

class SynapseProvisionError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.name = "SynapseProvisionError";
    this.status = status;
  }
}
var isEntityType = (value) => ENTITY_TYPES.includes(value);
var assertBillingEntity = (entity) => {
  if (!isEntityType(entity.entityType)) {
    throw new SynapseScopeError("billingEntity.entityType is not supported");
  }
  if (!UUID_RE.test(entity.entityId)) {
    throw new SynapseScopeError("billingEntity.entityId must be a UUID");
  }
};
var createSynapseProvisioner = (config) => {
  const { appId } = config;
  if (appId !== undefined && !APP_ID_RE.test(appId)) {
    throw new SynapseScopeError("appId must be a lowercase slug");
  }
  const apiUrl = config.apiUrl.replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;
  const now = config.now ?? Date.now;
  const ttl = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cache = new Map;
  return {
    async resolveKey(identityProviderId, meta, billingEntity) {
      if (billingEntity) {
        if (appId === undefined) {
          throw new SynapseScopeError("billingEntity requires appId");
        }
        assertBillingEntity(billingEntity);
      }
      const effectiveEntity = appId === undefined ? null : billingEntity ?? {
        entityType: "user",
        entityId: identityProviderId
      };
      const cacheKey = JSON.stringify([
        identityProviderId,
        appId ?? null,
        effectiveEntity?.entityType ?? null,
        effectiveEntity?.entityId.toLowerCase() ?? null
      ]);
      const cached = cache.get(cacheKey);
      if (cached && now() - cached.provisionedAt < ttl) {
        return cached.key;
      }
      const response = await doFetch(`${apiUrl}/internal/provision-managed-key`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-gateway-secret": config.gatewaySecret
        },
        body: JSON.stringify({
          identityProviderId,
          source: config.source,
          ...meta?.email && { email: meta.email },
          ...meta?.name && { name: meta.name },
          ...appId !== undefined && { appId },
          ...billingEntity && {
            billingEntity: {
              entityType: billingEntity.entityType,
              entityId: billingEntity.entityId
            }
          }
        })
      });
      if (!response.ok) {
        throw new SynapseProvisionError(`provision-managed-key failed: ${response.status}`, response.status);
      }
      const data = await response.json();
      if (!data.apiKey) {
        throw new SynapseProvisionError("provision-managed-key returned no apiKey");
      }
      cache.set(cacheKey, { key: data.apiKey, provisionedAt: now() });
      return data.apiKey;
    }
  };
};
// src/ai/synapse.ts
class SynapseRequestError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.name = "SynapseRequestError";
    this.status = status;
  }
}
var SYNAPSE_COST_HEADERS = {
  chargedUsd: "x-synapse-cost-usd",
  credits: "x-synapse-credits",
  providerCostUsd: "x-synapse-provider-cost-usd"
};
var costHeader = (headers, name) => {
  const raw = headers.get(name);
  if (raw === null || raw.trim() === "")
    return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
};
var estimateSynapseCostCents = (inputTokens, outputTokens, rate) => inputTokens / 1e6 * rate.inputCentsPerMTok + outputTokens / 1e6 * rate.outputCentsPerMTok;
var createSynapseClient = (config) => {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;
  const anthropicVersion = config.anthropicVersion ?? "2023-06-01";
  return {
    async messages(input) {
      const key = input.apiKey ?? config.apiKey;
      if (!key) {
        throw new SynapseRequestError("synapse request failed: no api key available");
      }
      const controller = new AbortController;
      const timeout = config.timeoutMs ? setTimeout(() => controller.abort(), config.timeoutMs) : undefined;
      let res;
      try {
        res = await doFetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": key,
            authorization: `Bearer ${key}`,
            "anthropic-version": anthropicVersion
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: input.maxTokens,
            system: input.system,
            messages: input.messages
          }),
          signal: controller.signal
        });
      } catch (err) {
        const reason = err instanceof Error ? err.message : "transport error";
        throw new SynapseRequestError(`synapse request failed: ${reason}`);
      } finally {
        if (timeout)
          clearTimeout(timeout);
      }
      if (!res.ok) {
        throw new SynapseRequestError(`synapse request failed: status ${res.status}`, res.status);
      }
      const data = await res.json();
      const text = (data.content ?? []).filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join("");
      const inputTokens = data.usage?.input_tokens ?? 0;
      const outputTokens = data.usage?.output_tokens ?? 0;
      const providerCostUsd = costHeader(res.headers, SYNAPSE_COST_HEADERS.providerCostUsd);
      const costCents = providerCostUsd !== null ? providerCostUsd * 100 : config.rate ? estimateSynapseCostCents(inputTokens, outputTokens, config.rate) : null;
      const chargedUsd = costHeader(res.headers, SYNAPSE_COST_HEADERS.chargedUsd);
      const credits = costHeader(res.headers, SYNAPSE_COST_HEADERS.credits);
      return {
        text,
        usage: { inputTokens, outputTokens, costCents, chargedUsd, credits }
      };
    }
  };
};
export {
  SYNAPSE_COST_HEADERS,
  SynapseProvisionError,
  SynapseRequestError,
  SynapseScopeError,
  createSynapseClient,
  createSynapseProvisioner,
  estimateSynapseCostCents
};
