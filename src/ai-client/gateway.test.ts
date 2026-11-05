import { describe, expect, test } from "bun:test";

import { GatewayError, classifyGatewayError } from "./errors";
import { createGatewayClient } from "./gateway";

import type { GatewayClientConfig } from "./gateway";

describe("classifyGatewayError", () => {
  test("maps managed-path statuses to actions", () => {
    expect(classifyGatewayError(401)).toBe("signIn");
    expect(classifyGatewayError(402)).toBe("outOfCredits");
    expect(classifyGatewayError(403)).toBe("notAllowed");
    expect(classifyGatewayError(429)).toBe("rateLimited");
    expect(classifyGatewayError(500)).toBe("generic");
    expect(classifyGatewayError(undefined)).toBe("generic");
  });
});

/** Build a client with a captured request and a scripted response. */
const makeClient = (
  response: Response | (() => never),
  overrides: Partial<GatewayClientConfig> = {},
) => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (typeof response === "function") response();
    return response;
  }) as unknown as typeof fetch;
  const client = createGatewayClient({
    baseUrl: "https://facet-api.omni.dev",
    getAccessToken: async () => "tok-managed",
    fetchImpl,
    ...overrides,
  });
  return { client, calls };
};

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });

describe("createGatewayClient", () => {
  test("throws not-configured when no base URL is set, without fetching", async () => {
    const { client } = makeClient(ok({}), { baseUrl: undefined });
    await expect(client.post("generate", { prompt: "x" })).rejects.toThrow(
      GatewayError,
    );
  });

  test("managed call sends a bearer token and returns the parsed result", async () => {
    const { client, calls } = makeClient(ok({ code: "cube(10)", usage: {} }));
    const result = await client.post<{ code: string }>("generate", {
      prompt: "a cube",
    });

    expect(result.code).toBe("cube(10)");
    expect(calls[0]!.url).toBe("https://facet-api.omni.dev/generate");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer tok-managed");
    // no BYOK key leaks into the managed body
    expect(JSON.parse(calls[0]!.init.body as string).byokKey).toBeUndefined();
  });

  test("BYOK call is anonymous (no bearer) and forwards the key in the body", async () => {
    const { client, calls } = makeClient(ok({ code: "x", usage: {} }));
    await client.post("generate", { prompt: "a cube" }, { byokKey: "sk-user" });

    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.authorization).toBeUndefined();
    expect(JSON.parse(calls[0]!.init.body as string).byokKey).toBe("sk-user");
  });

  test("managed call with no token throws a 401 sign-in error, never fetching", async () => {
    const { client, calls } = makeClient(ok({}), {
      getAccessToken: async () => null,
    });
    const err = await client.post("generate", { prompt: "x" }).catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  test("a non-ok response throws a GatewayError carrying the gateway message and status", async () => {
    const { client } = makeClient(
      new Response(JSON.stringify({ error: "You are out of AI credits." }), {
        status: 402,
      }),
    );
    const err = await client.post("generate", { prompt: "x" }).catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).status).toBe(402);
    expect((err as GatewayError).message).toBe("You are out of AI credits.");
    expect(classifyGatewayError((err as GatewayError).status)).toBe(
      "outOfCredits",
    );
  });

  test("a transport failure surfaces a generic message, never the raw error", async () => {
    const { client } = makeClient(() => {
      throw new Error("ECONNREFUSED 10.0.0.1:443");
    });
    const err = await client.post("generate", { prompt: "x" }).catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).message).not.toContain("ECONNREFUSED");
  });
});
