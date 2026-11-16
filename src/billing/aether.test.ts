import { afterEach, describe, expect, it, mock } from "bun:test";

import { createBillingProvider } from "./index";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Capture the one request the provider makes and answer it with `body` */
const captureFetch = (body: unknown, status = 200) => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = mock(
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify(body), { status });
    },
  ) as unknown as typeof fetch;
  return calls;
};

const provider = createBillingProvider({
  provider: "aether",
  baseUrl: "https://aether.test",
  appId: "runa",
  serviceApiKey: "runa-key",
});

const checkoutParams = {
  accessToken: "user-token",
  priceId: "price_test",
  successUrl: "https://runa.test/done",
  customerEmail: "user@example.com",
  metadata: { externalId: "user-1" },
};

describe("AetherBillingProvider.createCheckoutSession", () => {
  it("sends the user's token with the service key and names the app", async () => {
    const calls = captureFetch({ url: "https://checkout.stripe.com/c/1" });

    const url = await provider.createCheckoutSession(checkoutParams);

    expect(url).toBe("https://checkout.stripe.com/c/1");
    const [call] = calls;
    expect(call?.url).toBe("https://aether.test/checkout/session");
    expect(call?.init.headers).toMatchObject({
      Authorization: "Bearer user-token",
      "x-service-api-key": "runa-key",
    });
    const body = JSON.parse(String(call?.init.body));
    expect(body).toMatchObject({
      appId: "runa",
      priceId: "price_test",
      metadata: { externalId: "user-1" },
    });
    // The token travels only in the Authorization header
    expect(body.accessToken).toBeUndefined();
  });

  it("surfaces Aether's refusal", async () => {
    captureFetch({ error: "Unauthorized" }, 401);

    expect(provider.createCheckoutSession(checkoutParams)).rejects.toThrow(
      "Unauthorized",
    );
  });
});

describe("AetherBillingProvider.getAccountCredit", () => {
  it("reads the workspace's account credit for the signed-in user", async () => {
    const accountCredit = {
      balance: -1000,
      credit: 1000,
      due: 0,
      currency: "usd",
    };
    const calls = captureFetch({ accountCredit });

    const result = await provider.getAccountCredit(
      "organization",
      "org-1",
      "user-token",
    );

    expect(result).toEqual(accountCredit);
    const [call] = calls;
    expect(call?.url).toBe(
      "https://aether.test/billing-portal/account-credit/runa/organization/org-1",
    );
    expect(call?.init.headers).toMatchObject({
      Authorization: "Bearer user-token",
      "x-service-api-key": "runa-key",
    });
  });

  it("returns null when the user may not read it", async () => {
    captureFetch({ error: "Forbidden" }, 403);

    expect(
      await provider.getAccountCredit("organization", "org-1", "user-token"),
    ).toBeNull();
  });
});
