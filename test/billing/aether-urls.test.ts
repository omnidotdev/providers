import { describe, expect, it, mock } from "bun:test";

/**
 * Guard tests: ensure all billing-portal API calls include appId in the path.
 *
 * Missing appId causes 404s from Aether, silently breaking subscription
 * display across all Omni apps (shows "Free" instead of actual tier).
 */
describe("AetherBillingProvider URL paths", () => {
  // Capture all fetch calls to verify URL structure
  const fetchCalls: string[] = [];

  const mockFetch = mock(async (url: string) => {
    fetchCalls.push(url);
    return new Response(JSON.stringify({ subscription: null }), {
      status: 200,
    });
  });

  // Replace global fetch for testing
  const originalFetch = globalThis.fetch;

  const createProvider = async () => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const { createBillingProvider } = await import("../../src/billing/index");
    return createBillingProvider({
      provider: "aether",
      baseUrl: "https://api.billing.test",
      appId: "fractal",
    });
  };

  // biome-ignore lint/suspicious/noExplicitAny: test helper
  let provider: any;

  it("setup", async () => {
    provider = await createProvider();
  });

  it("getSubscription includes appId in path", async () => {
    fetchCalls.length = 0;
    await provider.getSubscription("organization", "org-123", "token");
    const url = fetchCalls[0];
    expect(url).toContain("/billing-portal/subscription/fractal/organization/org-123");
  });

  it("getBillingPortalUrl includes appId in path", async () => {
    fetchCalls.length = 0;
    try {
      await provider.getBillingPortalUrl("organization", "org-123", "fractal", "https://return.url", "token");
    } catch {
      // may fail due to mock response, but URL is captured
    }
    const url = fetchCalls[0];
    expect(url).toContain("/billing-portal/fractal/organization/org-123");
  });

  it("cancelSubscription includes appId in path", async () => {
    fetchCalls.length = 0;
    try {
      await provider.cancelSubscription("organization", "org-123", "token");
    } catch {
      // may fail due to mock response
    }
    const url = fetchCalls[0];
    expect(url).toContain("/billing-portal/subscription/fractal/organization/org-123/cancel");
  });

  it("renewSubscription includes appId in path", async () => {
    fetchCalls.length = 0;
    try {
      await provider.renewSubscription("organization", "org-123", "token");
    } catch {
      // may fail due to mock response
    }
    const url = fetchCalls[0];
    expect(url).toContain("/billing-portal/subscription/fractal/organization/org-123/renew");
  });

  it("no billing-portal URL should be missing appId segment", async () => {
    // All captured URLs that hit billing-portal should have 4+ path segments
    // (billing-portal / appId / entityType / entityId)
    const billingUrls = fetchCalls.filter((u) => u.includes("/billing-portal/"));
    for (const url of billingUrls) {
      const path = new URL(url).pathname;
      const segments = path.split("/").filter(Boolean);
      // billing-portal, appId, ...rest = at least 4 segments
      expect(segments.length).toBeGreaterThanOrEqual(4);
      // Second segment after "billing-portal" should NOT be "organization" or "user"
      // (that would mean appId is missing)
      const afterBillingPortal = segments[segments.indexOf("billing-portal") + 1];
      expect(afterBillingPortal).not.toBe("organization");
      expect(afterBillingPortal).not.toBe("user");
    }
  });

  // Cleanup
  it("cleanup", () => {
    globalThis.fetch = originalFetch;
  });
});
