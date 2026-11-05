// src/ai/provisioner.ts
var DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
var createSynapseProvisioner = (config) => {
  const apiUrl = config.apiUrl.replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;
  const now = config.now ?? Date.now;
  const ttl = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cache = new Map;
  return {
    async resolveKey(identityProviderId, meta) {
      const cached = cache.get(identityProviderId);
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
          ...meta?.name && { name: meta.name }
        })
      });
      if (!response.ok) {
        throw new Error(`provision-managed-key failed: ${response.status}`);
      }
      const data = await response.json();
      if (!data.apiKey) {
        throw new Error("provision-managed-key returned no apiKey");
      }
      cache.set(identityProviderId, { key: data.apiKey, provisionedAt: now() });
      return data.apiKey;
    }
  };
};
// src/ai/synapse.ts
var estimateSynapseCostCents = (inputTokens, outputTokens, rate) => inputTokens / 1e6 * rate.inputCentsPerMTok + outputTokens / 1e6 * rate.outputCentsPerMTok;
var createSynapseClient = (config) => {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;
  const anthropicVersion = config.anthropicVersion ?? "2023-06-01";
  return {
    async messages(input) {
      const key = input.apiKey ?? config.apiKey;
      if (!key) {
        throw new Error("synapse request failed: no api key available");
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
        throw new Error(`synapse request failed: ${reason}`);
      } finally {
        if (timeout)
          clearTimeout(timeout);
      }
      if (!res.ok) {
        throw new Error(`synapse request failed: status ${res.status}`);
      }
      const data = await res.json();
      const text = (data.content ?? []).filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join("");
      const inputTokens = data.usage?.input_tokens ?? 0;
      const outputTokens = data.usage?.output_tokens ?? 0;
      const costCents = typeof data.usage?.cost_cents === "number" ? data.usage.cost_cents : config.rate ? estimateSynapseCostCents(inputTokens, outputTokens, config.rate) : null;
      return { text, usage: { inputTokens, outputTokens, costCents } };
    }
  };
};
export {
  createSynapseClient,
  createSynapseProvisioner,
  estimateSynapseCostCents
};
