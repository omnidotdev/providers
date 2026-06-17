import { describe, expect, it } from "bun:test";

import { ErrorCode } from "@openfeature/server-sdk";

import { FractalOpenFeatureProvider } from "./openfeature";

/** A fetch stub that returns a canned evaluateFlags payload and records calls. */
function stubFetch(flags: Array<{ key: string; value: unknown }>): {
  fetch: typeof fetch;
  calls: Array<{ url: string; body: unknown }>;
} {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify({ data: { evaluateFlags: flags } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof globalThis.fetch;
  return { fetch: fetchImpl, calls };
}

function failingFetch(): typeof fetch {
  return (async () => {
    throw new Error("network down");
  }) as unknown as typeof fetch;
}

const baseConfig = { url: "https://api.test/graphql", project: "proj-1" };

describe("FractalOpenFeatureProvider", () => {
  it("reports its metadata name as fractal", () => {
    const provider = new FractalOpenFeatureProvider(baseConfig);
    expect(provider.metadata.name).toBe("fractal");
  });

  it("resolves a present boolean flag with TARGETING_MATCH", async () => {
    const { fetch } = stubFetch([{ key: "new-checkout", value: true }]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    const result = await provider.resolveBooleanEvaluation(
      "new-checkout",
      false,
      {},
    );
    expect(result.value).toBe(true);
    expect(result.reason).toBe("TARGETING_MATCH");
  });

  it("returns the default with DEFAULT reason when the flag is absent", async () => {
    const { fetch } = stubFetch([]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    const result = await provider.resolveBooleanEvaluation("missing", true, {});
    expect(result.value).toBe(true);
    expect(result.reason).toBe("DEFAULT");
  });

  it("resolves string flags", async () => {
    const { fetch } = stubFetch([{ key: "theme", value: "dark" }]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    const result = await provider.resolveStringEvaluation("theme", "light", {});
    expect(result.value).toBe("dark");
  });

  it("resolves number flags", async () => {
    const { fetch } = stubFetch([{ key: "max-items", value: 42 }]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    const result = await provider.resolveNumberEvaluation("max-items", 10, {});
    expect(result.value).toBe(42);
  });

  it("resolves object flags", async () => {
    const { fetch } = stubFetch([
      { key: "config", value: { tier: "pro", seats: 5 } },
    ]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    const result = await provider.resolveObjectEvaluation("config", {}, {});
    expect(result.value).toEqual({ tier: "pro", seats: 5 });
  });

  it("returns default with ERROR reason on a type mismatch", async () => {
    const { fetch } = stubFetch([{ key: "max-items", value: "not-a-number" }]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    const result = await provider.resolveNumberEvaluation("max-items", 10, {});
    expect(result.value).toBe(10);
    expect(result.reason).toBe("ERROR");
    expect(result.errorCode).toBe(ErrorCode.TYPE_MISMATCH);
  });

  it("degrades to the default with ERROR reason when fetch fails", async () => {
    const provider = new FractalOpenFeatureProvider({
      ...baseConfig,
      fetch: failingFetch(),
    });
    const result = await provider.resolveBooleanEvaluation("x", false, {});
    expect(result.value).toBe(false);
    expect(result.reason).toBe("ERROR");
    expect(result.errorCode).toBe(ErrorCode.GENERAL);
  });

  it("serves defaults without any network call in devMode", async () => {
    const { fetch, calls } = stubFetch([{ key: "x", value: true }]);
    const provider = new FractalOpenFeatureProvider({
      ...baseConfig,
      devMode: true,
      fetch,
    });
    const result = await provider.resolveBooleanEvaluation("x", false, {});
    expect(result.value).toBe(false);
    expect(calls.length).toBe(0);
  });

  it("maps the OpenFeature context targetingKey and attributes into the request", async () => {
    const { fetch, calls } = stubFetch([{ key: "x", value: true }]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    await provider.resolveBooleanEvaluation("x", false, {
      targetingKey: "user-7",
      plan: "pro",
    });
    const sent = calls[0]?.body as {
      variables: {
        projectId: string;
        environment: string;
        context: { targetingKey?: string; attributes?: Record<string, string> };
      };
    };
    expect(sent.variables.projectId).toBe("proj-1");
    expect(sent.variables.context.targetingKey).toBe("user-7");
    expect(sent.variables.context.attributes).toMatchObject({ plan: "pro" });
  });

  it("caches evaluations within the TTL (one fetch for repeated calls)", async () => {
    const { fetch, calls } = stubFetch([
      { key: "a", value: true },
      { key: "b", value: false },
    ]);
    const provider = new FractalOpenFeatureProvider({ ...baseConfig, fetch });
    await provider.resolveBooleanEvaluation("a", false, { targetingKey: "u" });
    await provider.resolveBooleanEvaluation("b", true, { targetingKey: "u" });
    expect(calls.length).toBe(1);
  });
});
