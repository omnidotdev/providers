import { describe, expect, it, mock } from "bun:test";

import { FractalFlagProvider } from "../../src/flags/fractal";

const base = {
  url: "https://api.fractal.omni.dev/graphql",
  project: "thrivestream",
  environment: "production",
};

type Evaluation = {
  key: string;
  value: unknown;
  variant: string;
  reason: string;
};

/** Mock fetch returning a GraphQL response with the given evaluations. */
function mockFetch(evaluations: Evaluation[]) {
  return mock(
    async () =>
      new Response(JSON.stringify({ data: { evaluateFlags: evaluations } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
}

describe("FractalFlagProvider", () => {
  it("returns true when the server evaluates the flag to true", async () => {
    const fetchMock = mockFetch([
      { key: "follows", value: true, variant: "on", reason: "DEFAULT" },
    ]);
    const provider = new FractalFlagProvider({ ...base, fetch: fetchMock });
    expect(await provider.isEnabled("follows")).toBe(true);
  });

  it("returns false when the server evaluates the flag to false", async () => {
    const fetchMock = mockFetch([
      { key: "follows", value: false, variant: "off", reason: "DEFAULT" },
    ]);
    const provider = new FractalFlagProvider({ ...base, fetch: fetchMock });
    expect(await provider.isEnabled("follows")).toBe(false);
  });

  it("returns the configured default when the flag is absent", async () => {
    const fetchMock = mockFetch([]);
    const provider = new FractalFlagProvider({
      ...base,
      defaults: { follows: true },
      fetch: fetchMock,
    });
    expect(await provider.isEnabled("follows")).toBe(true);
    expect(await provider.isEnabled("clips")).toBe(false);
  });

  it("caches evaluations within the TTL (one fetch per context)", async () => {
    const fetchMock = mockFetch([
      { key: "follows", value: true, variant: "on", reason: "DEFAULT" },
    ]);
    const provider = new FractalFlagProvider({ ...base, fetch: fetchMock });
    await provider.isEnabled("follows");
    await provider.isEnabled("follows");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to defaults when the request fails", async () => {
    const fetchMock = mock(async () => {
      throw new Error("network down");
    });
    const provider = new FractalFlagProvider({
      ...base,
      defaults: { follows: true },
      fetch: fetchMock,
    });
    expect(await provider.isEnabled("follows")).toBe(true);
  });

  it("falls back to defaults on a GraphQL error response", async () => {
    const fetchMock = mock(
      async () =>
        new Response(JSON.stringify({ errors: [{ message: "boom" }] }), {
          status: 200,
        }),
    );
    const provider = new FractalFlagProvider({
      ...base,
      defaults: { follows: true },
      fetch: fetchMock,
    });
    expect(await provider.isEnabled("follows")).toBe(true);
  });

  it("does not fetch in devMode", async () => {
    const fetchMock = mock(async () => new Response("{}"));
    const provider = new FractalFlagProvider({
      ...base,
      devMode: true,
      defaults: { follows: true },
      fetch: fetchMock,
    });
    expect(await provider.isEnabled("follows")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it("maps userId to the targeting key and properties to attributes", async () => {
    let captured: { variables?: Record<string, unknown> } = {};
    const fetchMock = mock(async (_url: string, init: RequestInit) => {
      captured = JSON.parse(init.body as string);
      return new Response(JSON.stringify({ data: { evaluateFlags: [] } }), {
        status: 200,
      });
    });
    const provider = new FractalFlagProvider({ ...base, fetch: fetchMock });
    await provider.isEnabled("follows", {
      userId: "u1",
      properties: { plan: "pro" },
    });
    const context = (captured.variables as { context: Record<string, unknown> })
      .context;
    expect(context.targetingKey).toBe("u1");
    expect(context.attributes).toMatchObject({ plan: "pro" });
  });

  it("evaluates different contexts independently (separate cache entries)", async () => {
    const fetchMock = mockFetch([
      { key: "follows", value: true, variant: "on", reason: "DEFAULT" },
    ]);
    const provider = new FractalFlagProvider({ ...base, fetch: fetchMock });
    await provider.isEnabled("follows", { userId: "a" });
    await provider.isEnabled("follows", { userId: "b" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("close clears the cache so the next call refetches", async () => {
    const fetchMock = mockFetch([
      { key: "follows", value: true, variant: "on", reason: "DEFAULT" },
    ]);
    const provider = new FractalFlagProvider({ ...base, fetch: fetchMock });
    await provider.isEnabled("follows");
    await provider.close();
    await provider.isEnabled("follows");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
