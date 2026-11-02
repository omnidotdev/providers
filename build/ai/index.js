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
  estimateSynapseCostCents
};
