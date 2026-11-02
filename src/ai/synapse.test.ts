import { describe, expect, test } from "bun:test";

import { createSynapseClient, estimateSynapseCostCents } from "./synapse";

/** Build a fetch stub recording calls and returning a scripted response. */
const makeFetch = (res: {
  ok?: boolean;
  status?: number;
  body?: unknown;
  throws?: boolean;
}): {
  fetchImpl: typeof fetch;
  calls: { url: string; init?: RequestInit }[];
} => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (res.throws) throw new Error("network down");
    return {
      ok: res.ok ?? true,
      status: res.status ?? 200,
      json: async () => res.body ?? {},
    } as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
};

const OK_BODY = {
  content: [
    { type: "text", text: "hello " },
    { type: "tool_use" },
    { type: "text", text: "world" },
  ],
  usage: { input_tokens: 100, output_tokens: 50 },
};

describe("createSynapseClient.messages", () => {
  test("posts to /v1/messages with the model, system, messages, and cap", async () => {
    const { fetchImpl, calls } = makeFetch({ body: OK_BODY });
    const client = createSynapseClient({
      baseUrl: "https://gateway.synapse.example.com/",
      apiKey: "server-key",
      model: "anthropic/claude-sonnet-4-5-20250929",
      fetchImpl,
    });

    await client.messages({
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 2048,
    });

    expect(calls[0]!.url).toBe(
      "https://gateway.synapse.example.com/v1/messages",
    );
    const init = calls[0]!.init!;
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("server-key");
    expect(headers.authorization).toBe("Bearer server-key");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    const payload = JSON.parse(init.body as string);
    expect(payload).toMatchObject({
      model: "anthropic/claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
    });
  });

  test("concatenates only text blocks and returns token usage", async () => {
    const { fetchImpl } = makeFetch({ body: OK_BODY });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "m",
      fetchImpl,
    });
    const result = await client.messages({
      system: "",
      messages: [],
      maxTokens: 10,
    });
    expect(result.text).toBe("hello world");
    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
  });

  test("a per-request key (BYOK) overrides the configured key", async () => {
    const { fetchImpl, calls } = makeFetch({ body: OK_BODY });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "server-key",
      model: "m",
      fetchImpl,
    });
    await client.messages({
      system: "",
      messages: [],
      maxTokens: 10,
      apiKey: "byok-key",
    });
    const headers = calls[0]!.init!.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("byok-key");
    expect(headers.authorization).toBe("Bearer byok-key");
  });

  test("estimates cost from the rate when Synapse reports none", async () => {
    const { fetchImpl } = makeFetch({ body: OK_BODY });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "m",
      rate: { inputCentsPerMTok: 300, outputCentsPerMTok: 1500 },
      fetchImpl,
    });
    const result = await client.messages({
      system: "",
      messages: [],
      maxTokens: 10,
    });
    // 100/1e6*300 + 50/1e6*1500 = 0.03 + 0.075 = 0.105
    expect(result.usage.costCents).toBeCloseTo(0.105, 6);
  });

  test("uses Synapse's reported cost_cents when present", async () => {
    const { fetchImpl } = makeFetch({
      body: { ...OK_BODY, usage: { ...OK_BODY.usage, cost_cents: 7 } },
    });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "m",
      rate: { inputCentsPerMTok: 300, outputCentsPerMTok: 1500 },
      fetchImpl,
    });
    const result = await client.messages({
      system: "",
      messages: [],
      maxTokens: 10,
    });
    expect(result.usage.costCents).toBe(7);
  });

  test("cost is null when no rate is configured and none is reported", async () => {
    const { fetchImpl } = makeFetch({ body: OK_BODY });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "m",
      fetchImpl,
    });
    const result = await client.messages({
      system: "",
      messages: [],
      maxTokens: 10,
    });
    expect(result.usage.costCents).toBeNull();
  });

  test("throws a generic error on a non-2xx response (no provider detail)", async () => {
    const { fetchImpl } = makeFetch({ ok: false, status: 502 });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "m",
      fetchImpl,
    });
    await expect(
      client.messages({ system: "", messages: [], maxTokens: 10 }),
    ).rejects.toThrow("synapse request failed");
  });

  test("throws a generic error on a transport failure", async () => {
    const { fetchImpl } = makeFetch({ throws: true });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "m",
      fetchImpl,
    });
    await expect(
      client.messages({ system: "", messages: [], maxTokens: 10 }),
    ).rejects.toThrow("synapse request failed");
  });

  test("throws when no key is available (misuse guard)", async () => {
    const { fetchImpl, calls } = makeFetch({ body: OK_BODY });
    const client = createSynapseClient({
      baseUrl: "https://g",
      model: "m",
      fetchImpl,
    });
    await expect(
      client.messages({ system: "", messages: [], maxTokens: 10 }),
    ).rejects.toThrow("no api key available");
    expect(calls).toHaveLength(0);
  });
});

describe("estimateSynapseCostCents", () => {
  test("computes cents from tokens and the per-million rate", () => {
    expect(
      estimateSynapseCostCents(1_000_000, 1_000_000, {
        inputCentsPerMTok: 300,
        outputCentsPerMTok: 1500,
      }),
    ).toBeCloseTo(1800, 6);
  });
});
