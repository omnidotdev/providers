import { describe, expect, it } from "bun:test";

import { NoopFlagProvider } from "../../src/flags/noop";

describe("NoopFlagProvider", () => {
  it("should return false by default", async () => {
    const provider = new NoopFlagProvider();

    const result = await provider.isEnabled("some-flag");

    expect(result).toBe(false);
  });

  it("should return configured defaults", async () => {
    const provider = new NoopFlagProvider({
      defaults: { "feature-a": true, "feature-b": false },
    });

    expect(await provider.isEnabled("feature-a")).toBe(true);
    expect(await provider.isEnabled("feature-b")).toBe(false);
  });

  it("should return false for unknown flags when defaults are configured", async () => {
    const provider = new NoopFlagProvider({
      defaults: { "feature-a": true },
    });

    expect(await provider.isEnabled("unknown-flag")).toBe(false);
  });

  it("should report healthy", async () => {
    const provider = new NoopFlagProvider();
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
    expect(health.message).toBe("noop");
  });

  it("should close without error", async () => {
    const provider = new NoopFlagProvider();
    await expect(provider.close()).resolves.toBeUndefined();
  });
});
