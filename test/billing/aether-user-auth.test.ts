import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { AetherBillingProvider } from "../../src/billing/aether";

/**
 * A product acts for its signed-in user by sending its service key WITH the
 * user's token: the token is minted for the product's own API (or is opaque),
 * so Aether accepts it only when the product's key vouches for the call. These
 * tests pin which credentials each call carries
 */
describe("AetherBillingProvider credentials", () => {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];

  const originalFetch = globalThis.fetch;

  globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
    });
    return new Response(
      JSON.stringify({
        url: "https://billing.stripe.com/p/session/test",
        checkoutUrl: "https://checkout.stripe.com/c/pay/test",
        subscription: null,
        subscriptions: [],
        id: "sub_1",
        entitlements: [],
      }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  const provider = new AetherBillingProvider({
    baseUrl: "https://api.billing.test",
    appId: "keystone",
    serviceApiKey: "service-key",
  });

  const keylessProvider = new AetherBillingProvider({
    baseUrl: "https://api.billing.test",
    appId: "keystone",
  });

  beforeEach(() => {
    calls.length = 0;
  });

  const userCalls: Array<
    [string, (p: AetherBillingProvider) => Promise<unknown>]
  > = [
    [
      "createCheckoutWithWorkspace",
      (p) =>
        p.createCheckoutWithWorkspace({
          appId: "keystone",
          priceId: "price_1",
          successUrl: "https://keystone.test/ok",
          cancelUrl: "https://keystone.test/cancel",
          accessToken: "user-token",
          workspaceId: "org-1",
        }),
    ],
    [
      "getSubscription",
      (p) => p.getSubscription("organization", "org-1", "user-token"),
    ],
    [
      "listSubscriptions",
      (p) => p.listSubscriptions("organization", "org-1", "user-token"),
    ],
    [
      "getBillingPortalUrl",
      (p) =>
        p.getBillingPortalUrl(
          "organization",
          "org-1",
          "keystone",
          "https://keystone.test/billing",
          "user-token",
        ),
    ],
    [
      "cancelSubscription",
      (p) => p.cancelSubscription("organization", "org-1", "user-token"),
    ],
    [
      "renewSubscription",
      (p) => p.renewSubscription("organization", "org-1", "user-token"),
    ],
  ];

  for (const [name, call] of userCalls) {
    it(`${name} sends the service key with the user's token`, async () => {
      await call(provider);

      expect(calls).toHaveLength(1);
      expect(calls[0]?.headers["x-service-api-key"]).toBe("service-key");
      expect(calls[0]?.headers.authorization).toBe("Bearer user-token");
    });

    it(`${name} sends the user's token alone without a configured key`, async () => {
      await call(keylessProvider);

      expect(calls).toHaveLength(1);
      expect(calls[0]?.headers["x-service-api-key"]).toBeUndefined();
      expect(calls[0]?.headers.authorization).toBe("Bearer user-token");
    });
  }

  it("never sends the user's token to the entitlement routes", async () => {
    await provider.getEntitlementsResult(
      "organization",
      "org-entitlements",
      "keystone",
      "user-token",
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers["x-service-api-key"]).toBe("service-key");
    expect(calls[0]?.headers.authorization).toBeUndefined();
  });
});
