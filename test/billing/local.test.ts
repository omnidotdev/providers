import { describe, expect, it } from "bun:test";

import { LocalBillingProvider } from "../../src/billing/local";

describe("LocalBillingProvider", () => {
  const provider = new LocalBillingProvider();

  it("should return unlimited entitlements with correct entity info", async () => {
    const result = await provider.getEntitlements("organization", "org-123");

    expect(result).not.toBeNull();
    expect(result!.entityType).toBe("organization");
    expect(result!.entityId).toBe("org-123");
    expect(result!.billingAccountId).toBe("self-hosted");
    expect(result!.entitlements.length).toBeGreaterThan(0);
  });

  it("should return entitlement values for known features", async () => {
    const tier = await provider.checkEntitlement(
      "organization",
      "org-123",
      "platform",
      "tier",
    );
    expect(tier).toBe("enterprise");
  });

  it("should return 'unlimited' for unknown features", async () => {
    const value = await provider.checkEntitlement(
      "organization",
      "org-123",
      "platform",
      "unknown_feature",
    );
    expect(value).toBe("unlimited");
  });

  it("should return empty prices", async () => {
    const prices = await provider.getPrices("runa");
    expect(prices).toEqual([]);
  });

  it("should throw on checkout session creation", async () => {
    await expect(
      provider.createCheckoutSession({
        priceId: "price-1",
        successUrl: "http://localhost",
        customerEmail: "test@test.com",
      }),
    ).rejects.toThrow("self-hosted");
  });

  it("should return self-hosted subscription", async () => {
    const sub = await provider.getSubscription(
      "organization",
      "org-123",
      "token",
    );
    expect(sub).not.toBeNull();
    expect(sub!.id).toBe("self-hosted");
    expect(sub!.status).toBe("active");
  });

  it("should return the return URL as billing portal URL", async () => {
    const url = await provider.getBillingPortalUrl(
      "organization",
      "org-123",
      "platform",
      "http://localhost/billing",
      "token",
    );
    expect(url).toBe("http://localhost/billing");
  });

  it("should report healthy", async () => {
    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);
  });
});
