import { describe, expect, test } from "bun:test";

import {
  SynapseRequestError,
  createSynapseClient,
  estimateSynapseCostCents,
} from "./synapse";

/** Build a fetch stub recording calls and returning a scripted response. */
const makeFetch = (res: {
  ok?: boolean;
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
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
      headers: new Headers(res.headers ?? {}),
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

  test("forwards a multimodal message (text + inline image) unchanged", async () => {
    const { fetchImpl, calls } = makeFetch({ body: OK_BODY });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "anthropic/claude-opus-4-6",
      fetchImpl,
    });

    await client.messages({
      system: "critique this render",
      maxTokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "does this match 'scorpio symbol'?" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "aGVsbG8=",
              },
            },
          ],
        },
      ],
    });

    const payload = JSON.parse(calls[0]!.init!.body as string);
    expect(payload.messages[0].content).toEqual([
      { type: "text", text: "does this match 'scorpio symbol'?" },
      {
        type: "image",
        source: { type: "base64", media_type: "image/png", data: "aGVsbG8=" },
      },
    ]);
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

  test("uses the gateway's reported provider cost over the estimate", async () => {
    const { fetchImpl } = makeFetch({
      body: OK_BODY,
      headers: {
        "x-synapse-provider-cost-usd": "0.0712",
        "x-synapse-cost-usd": "0.1424",
        "x-synapse-credits": "14.24",
      },
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
    // Real spend in cents is the pre-margin provider cost, never the retail charge
    expect(result.usage.costCents).toBeCloseTo(7.12, 6);
    expect(result.usage.chargedUsd).toBeCloseTo(0.1424, 6);
    expect(result.usage.credits).toBeCloseTo(14.24, 6);
  });

  test("a zero reported cost (BYOK) is a real zero, not unknown", async () => {
    const { fetchImpl } = makeFetch({
      body: OK_BODY,
      headers: {
        "x-synapse-provider-cost-usd": "0",
        "x-synapse-cost-usd": "0",
        "x-synapse-credits": "0",
      },
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
    expect(result.usage.costCents).toBe(0);
    expect(result.usage.chargedUsd).toBe(0);
  });

  test("ignores a malformed cost header and falls back to the estimate", async () => {
    const { fetchImpl } = makeFetch({
      body: OK_BODY,
      headers: { "x-synapse-provider-cost-usd": "not-a-number" },
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
    expect(result.usage.costCents).toBeCloseTo(0.105, 6);
    expect(result.usage.chargedUsd).toBeNull();
    expect(result.usage.credits).toBeNull();
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

describe("SynapseRequestError", () => {
  for (const status of [402, 503]) {
    test(`a ${status} response throws a SynapseRequestError carrying the status`, async () => {
      const { fetchImpl } = makeFetch({ ok: false, status });
      const client = createSynapseClient({
        baseUrl: "https://g",
        apiKey: "k",
        model: "m",
        fetchImpl,
      });

      const err = await client
        .messages({ system: "s", messages: [], maxTokens: 1 })
        .catch((e) => e);

      expect(err).toBeInstanceOf(SynapseRequestError);
      expect(err).toBeInstanceOf(Error);
      expect((err as SynapseRequestError).status).toBe(status);
      expect((err as SynapseRequestError).name).toBe("SynapseRequestError");
      // existing message is preserved for callers matching on it
      expect((err as Error).message).toBe(
        `synapse request failed: status ${status}`,
      );
    });
  }

  test("a transport failure throws a SynapseRequestError with no status", async () => {
    const { fetchImpl } = makeFetch({ throws: true });
    const client = createSynapseClient({
      baseUrl: "https://g",
      apiKey: "k",
      model: "m",
      fetchImpl,
    });

    const err = await client
      .messages({ system: "s", messages: [], maxTokens: 1 })
      .catch((e) => e);

    expect(err).toBeInstanceOf(SynapseRequestError);
    expect((err as SynapseRequestError).status).toBeUndefined();
    expect((err as Error).message).toBe("synapse request failed: network down");
  });
});
