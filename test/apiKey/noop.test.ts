import { describe, expect, it } from "bun:test";

import { NoopApiKeyProvider } from "../../src/apiKey/noop";

describe("NoopApiKeyProvider", () => {
  it("should return null by default", async () => {
    const provider = new NoopApiKeyProvider();

    const result = await provider.verifyApiKey("any-key");

    expect(result).toBeNull();
  });

  it("should return mockResult when configured", async () => {
    const mockInfo = {
      id: "key-1",
      name: "Test Key",
      userId: "user-1",
      organizationId: "org-1",
      metadata: { role: "admin" },
    };
    const provider = new NoopApiKeyProvider({ mockResult: mockInfo });

    const result = await provider.verifyApiKey("any-key");

    expect(result).toEqual(mockInfo);
  });

  it("should report healthy", async () => {
    const provider = new NoopApiKeyProvider();
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
    expect(health.message).toBe("noop");
  });

  it("should close without error", async () => {
    const provider = new NoopApiKeyProvider();
    await expect(provider.close()).resolves.toBeUndefined();
  });
});
