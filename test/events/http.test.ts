import { describe, expect, it } from "bun:test";

import { retryWithBackoff } from "../../src/events/http";

describe("retryWithBackoff", () => {
  it("should return on first success", async () => {
    let attempts = 0;

    const result = await retryWithBackoff(async () => {
      attempts++;
      return "ok";
    }, 3);

    expect(result).toBe("ok");
    expect(attempts).toBe(1);
  });

  it("should retry on failure and succeed", async () => {
    let attempts = 0;

    const result = await retryWithBackoff(async () => {
      attempts++;
      if (attempts < 3) throw new Error("transient");
      return "recovered";
    }, 3);

    expect(result).toBe("recovered");
    expect(attempts).toBe(3);
  });

  it("should throw after exhausting retries", async () => {
    let attempts = 0;

    await expect(
      retryWithBackoff(async () => {
        attempts++;
        throw new Error("permanent");
      }, 2),
    ).rejects.toThrow("permanent");

    expect(attempts).toBe(2);
  });

  it("should throw the last error", async () => {
    let attempts = 0;

    await expect(
      retryWithBackoff(async () => {
        attempts++;
        throw new Error(`fail-${attempts}`);
      }, 3),
    ).rejects.toThrow("fail-3");
  });
});

describe("HttpEventsProvider", () => {
  it("should construct with valid config", async () => {
    const { HttpEventsProvider } = await import("../../src/events/http");

    const provider = new HttpEventsProvider({
      baseUrl: "http://localhost:3000",
      apiKey: "test-key",
    });

    expect(provider).toBeDefined();
    expect(provider.emit).toBeFunction();
    expect(provider.emitBatch).toBeFunction();
    expect(provider.healthCheck).toBeFunction();
  });
});

describe("HttpEventsProvider with batch", () => {
  it("accepts batch config without errors", async () => {
    const { HttpEventsProvider } = await import("../../src/events/http");

    const provider = new HttpEventsProvider({
      baseUrl: "https://api.vortex.test",
      apiKey: "test-key",
      batch: { maxSize: 10, flushIntervalMs: 100 },
    });

    expect(provider).toBeDefined();

    await provider.close();
  });

  it("returns buffered result when batch is enabled", async () => {
    const { HttpEventsProvider } = await import("../../src/events/http");

    const provider = new HttpEventsProvider({
      baseUrl: "https://api.vortex.test",
      apiKey: "test-key",
      batch: { maxSize: 50, flushIntervalMs: 5000 },
    });

    const result = await provider.emit({
      type: "test.event",
      data: { foo: "bar" },
    });

    expect(result.eventId).toBe("buffered");
    expect(result.timestamp).toBeDefined();

    await provider.close();
  });
});
