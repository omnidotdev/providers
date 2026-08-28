import { afterEach, describe, expect, it, mock } from "bun:test";

import { createBillingProvider } from "../../src/billing/index";

/**
 * `getEntitlementsResult` must distinguish the three outcomes a caller needs to
 * fail closed safely: entitlements resolved, a legit no-account (404), and an
 * Aether error - where `getEntitlements` collapses the last two to `null`.
 */
describe("AetherBillingProvider.getEntitlementsResult", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const providerWith = (fetchImpl: typeof fetch) => {
    globalThis.fetch = fetchImpl;
    return createBillingProvider({
      provider: "aether",
      baseUrl: "https://api.billing.test",
      appId: "herald",
    });
  };

  const body = {
    billingAccountId: "acct",
    entityType: "organization",
    entityId: "org-1",
    entitlementVersion: 1,
    entitlements: [],
  };

  it("returns success with data on 200", async () => {
    const provider = providerWith(
      mock(
        async () => new Response(JSON.stringify(body), { status: 200 }),
      ) as unknown as typeof fetch,
    );
    const result = await provider.getEntitlementsResult(
      "organization",
      "org-1",
      "herald",
    );
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.data.entityId).toBe("org-1");
    // getEntitlements still returns the raw data
    expect(
      await provider.getEntitlements("organization", "org-2", "herald"),
    ).toMatchObject({
      entityId: "org-1",
    });
  });

  it("returns not_found on 404 (legit no-account, not an error)", async () => {
    const provider = providerWith(
      mock(
        async () => new Response("", { status: 404 }),
      ) as unknown as typeof fetch,
    );
    const result = await provider.getEntitlementsResult(
      "organization",
      "no-acct",
      "herald",
    );
    expect(result).toEqual({ status: "not_found" });
    // the legacy shape collapses this to null
    expect(
      await provider.getEntitlements("organization", "no-acct2", "herald"),
    ).toBeNull();
  });

  it("returns unavailable on a 5xx (Aether error, distinct from not_found)", async () => {
    const provider = providerWith(
      mock(
        async () => new Response("boom", { status: 500 }),
      ) as unknown as typeof fetch,
    );
    const result = await provider.getEntitlementsResult(
      "organization",
      "org-err",
      "herald",
    );
    expect(result.status).toBe("unavailable");
  });

  it("returns unavailable when the request throws", async () => {
    const provider = providerWith(
      mock(async () => {
        throw new Error("ECONNREFUSED");
      }) as unknown as typeof fetch,
    );
    const result = await provider.getEntitlementsResult(
      "organization",
      "org-net",
      "herald",
    );
    expect(result.status).toBe("unavailable");
  });
});
