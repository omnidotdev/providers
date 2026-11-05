import { describe, expect, test } from "bun:test";

import { createSynapseProvisioner } from "./provisioner";

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

describe("createSynapseProvisioner.resolveKey", () => {
  test("provisions a per-user key with the gateway secret, source, and meta", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-user-1" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com/",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
    });

    const key = await provisioner.resolveKey("user-1", {
      email: "a@b.com",
      name: "A",
    });

    expect(key).toBe("sk-user-1");
    expect(calls).toHaveLength(1);
    // trailing slash on apiUrl is trimmed
    expect(calls[0]!.url).toBe(
      "https://api.synapse.example.com/internal/provision-managed-key",
    );
    const init = calls[0]!.init!;
    expect((init.headers as Record<string, string>)["x-gateway-secret"]).toBe(
      "secret",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      identityProviderId: "user-1",
      source: "Facet",
      email: "a@b.com",
      name: "A",
    });
  });

  test("omits meta fields when not provided", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-user-1" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Creator",
      fetchImpl,
    });

    await provisioner.resolveKey("user-1");

    expect(JSON.parse(calls[0]!.init!.body as string)).toEqual({
      identityProviderId: "user-1",
      source: "Creator",
    });
  });

  test("caches the key within the TTL so a second resolve does not re-provision", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-user-1" } });
    let clock = 1_000;
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
      now: () => clock,
    });

    await provisioner.resolveKey("user-1");
    clock += 60_000; // still inside the 5 min TTL
    const key = await provisioner.resolveKey("user-1");

    expect(key).toBe("sk-user-1");
    expect(calls).toHaveLength(1);
  });

  test("re-provisions after the TTL expires", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-user-1" } });
    let clock = 1_000;
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
      now: () => clock,
    });

    await provisioner.resolveKey("user-1");
    clock += 6 * 60 * 1000; // past the TTL
    await provisioner.resolveKey("user-1");

    expect(calls).toHaveLength(2);
  });

  test("re-provisions a different user independently", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-user" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
    });

    await provisioner.resolveKey("user-1");
    await provisioner.resolveKey("user-2");

    expect(calls).toHaveLength(2);
  });

  test("throws on a non-ok response so the caller can fall back", async () => {
    const { fetchImpl } = makeFetch({ ok: false, status: 503 });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
    });

    expect(provisioner.resolveKey("user-1")).rejects.toThrow(
      "provision-managed-key failed: 503",
    );
  });

  test("throws when the response carries no apiKey", async () => {
    const { fetchImpl } = makeFetch({ body: {} });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
    });

    expect(provisioner.resolveKey("user-1")).rejects.toThrow(
      "returned no apiKey",
    );
  });
});
