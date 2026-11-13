import { describe, expect, test } from "bun:test";

import {
  SynapseProvisionError,
  SynapseScopeError,
  createSynapseProvisioner,
} from "./provisioner";

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

  test("a non-ok response throws a SynapseProvisionError carrying the status", async () => {
    const { fetchImpl } = makeFetch({ ok: false, status: 403 });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
    });

    const err = await provisioner.resolveKey("user-1").catch((e) => e);

    expect(err).toBeInstanceOf(SynapseProvisionError);
    expect(err).toBeInstanceOf(Error);
    expect((err as SynapseProvisionError).status).toBe(403);
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

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("createSynapseProvisioner product scope", () => {
  test("a scoped call carries appId and billingEntity in the body", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-scoped" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      appId: "facet",
      fetchImpl,
    });

    const key = await provisioner.resolveKey(
      USER_ID,
      { email: "a@b.com" },
      { entityType: "organization", entityId: ORG_A },
    );

    expect(key).toBe("sk-scoped");
    expect(JSON.parse(calls[0]!.init!.body as string)).toEqual({
      identityProviderId: USER_ID,
      source: "Facet",
      email: "a@b.com",
      appId: "facet",
      billingEntity: { entityType: "organization", entityId: ORG_A },
    });
  });

  test("an appId without a billingEntity sends appId only (server bills the user)", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-scoped" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      appId: "facet",
      fetchImpl,
    });

    await provisioner.resolveKey(USER_ID);

    expect(JSON.parse(calls[0]!.init!.body as string)).toEqual({
      identityProviderId: USER_ID,
      source: "Facet",
      appId: "facet",
    });
  });

  test("an unscoped call body carries neither appId nor billingEntity", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-direct" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Creator",
      fetchImpl,
    });

    await provisioner.resolveKey(USER_ID, { name: "A" });

    const body = JSON.parse(calls[0]!.init!.body as string);
    expect(body).toEqual({
      identityProviderId: USER_ID,
      source: "Creator",
      name: "A",
    });
    expect("appId" in body).toBe(false);
    expect("billingEntity" in body).toBe(false);
  });

  test("a billingEntity without an appId is rejected before any request", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
    });

    const err = await provisioner
      .resolveKey(USER_ID, undefined, {
        entityType: "organization",
        entityId: ORG_A,
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(SynapseScopeError);
    expect((err as Error).message).toBe("billingEntity requires appId");
    expect(calls).toHaveLength(0);
  });

  test("a non-slug appId is rejected at construction", () => {
    for (const appId of ["Facet", "1facet", "facet_app", "", "a".repeat(64)]) {
      expect(() =>
        createSynapseProvisioner({
          apiUrl: "https://api.synapse.example.com",
          gatewaySecret: "secret",
          source: "Facet",
          appId,
        }),
      ).toThrow(SynapseScopeError);
    }
  });

  test("an unsupported entityType is rejected before any request", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      appId: "facet",
      fetchImpl,
    });

    const err = await provisioner
      .resolveKey(USER_ID, undefined, {
        entityType: "team" as "organization",
        entityId: ORG_A,
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(SynapseScopeError);
    expect(calls).toHaveLength(0);
  });

  test("a non-uuid entityId is rejected before any request", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      appId: "facet",
      fetchImpl,
    });

    const err = await provisioner
      .resolveKey(USER_ID, undefined, {
        entityType: "organization",
        entityId: "org-a",
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(SynapseScopeError);
    expect(calls).toHaveLength(0);
  });

  test("the cache isolates one user's keys across billing entities", async () => {
    let n = 0;
    const calls: unknown[] = [];
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      calls.push(JSON.parse(init!.body as string));
      n += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ apiKey: `sk-${n}` }),
      } as Response;
    }) as unknown as typeof fetch;
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      appId: "facet",
      fetchImpl,
    });
    const orgA = { entityType: "organization", entityId: ORG_A } as const;
    const orgB = { entityType: "organization", entityId: ORG_B } as const;

    const a1 = await provisioner.resolveKey(USER_ID, undefined, orgA);
    const b1 = await provisioner.resolveKey(USER_ID, undefined, orgB);
    const self = await provisioner.resolveKey(USER_ID);
    // each entity is served from its own cache slot, never another entity's
    const a2 = await provisioner.resolveKey(USER_ID, undefined, orgA);
    const b2 = await provisioner.resolveKey(USER_ID, undefined, orgB);
    const self2 = await provisioner.resolveKey(USER_ID);

    expect(new Set([a1, b1, self]).size).toBe(3);
    expect(a2).toBe(a1);
    expect(b2).toBe(b1);
    expect(self2).toBe(self);
    expect(calls).toHaveLength(3);
  });

  test("the explicit user entity and the implicit default share one cache slot", async () => {
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk-self" } });
    const provisioner = createSynapseProvisioner({
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      appId: "facet",
      fetchImpl,
    });

    await provisioner.resolveKey(USER_ID);
    await provisioner.resolveKey(USER_ID, undefined, {
      entityType: "user",
      entityId: USER_ID,
    });

    expect(calls).toHaveLength(1);
  });

  test("the cache isolates keys across apps", async () => {
    // provisioners are per app, but a shared cache must never leak across them;
    // two apps sharing one fetch each provision their own key
    const { fetchImpl, calls } = makeFetch({ body: { apiKey: "sk" } });
    const base = {
      apiUrl: "https://api.synapse.example.com",
      gatewaySecret: "secret",
      source: "Facet",
      fetchImpl,
    };
    const facet = createSynapseProvisioner({ ...base, appId: "facet" });
    const creator = createSynapseProvisioner({ ...base, appId: "creator" });
    const direct = createSynapseProvisioner(base);
    const orgA = { entityType: "organization", entityId: ORG_A } as const;

    await facet.resolveKey(USER_ID, undefined, orgA);
    await creator.resolveKey(USER_ID, undefined, orgA);
    await direct.resolveKey(USER_ID);

    expect(calls).toHaveLength(3);
    const apps = calls.map(
      (c) => JSON.parse(c.init!.body as string).appId as string | undefined,
    );
    expect(apps).toEqual(["facet", "creator", undefined]);
  });
});
