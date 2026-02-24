import { describe, expect, it } from "bun:test";

import { NoopEventsProvider } from "../../src/events/noop";

describe("NoopEventsProvider", () => {
  it("should return a valid emit result", async () => {
    const provider = new NoopEventsProvider();

    const result = await provider.emit({
      type: "test.event",
      data: { foo: "bar" },
    });

    expect(result.eventId).toBeTruthy();
    expect(result.timestamp).toBeTruthy();
    // Verify UUID format
    expect(result.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    // Verify ISO timestamp
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it("should return unique IDs for each emit", async () => {
    const provider = new NoopEventsProvider();

    const a = await provider.emit({
      type: "test.event",
      data: {},
    });
    const b = await provider.emit({
      type: "test.event",
      data: {},
    });

    expect(a.eventId).not.toBe(b.eventId);
  });

  it("should handle emitBatch", async () => {
    const provider = new NoopEventsProvider();

    const results = await provider.emitBatch([
      { type: "test.a", data: { a: 1 } },
      { type: "test.b", data: { b: 2 } },
      { type: "test.c", data: { c: 3 } },
    ]);

    expect(results).toHaveLength(3);

    const ids = new Set(results.map((r) => r.eventId));
    expect(ids.size).toBe(3);
  });

  it("should report healthy", async () => {
    const provider = new NoopEventsProvider();
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
    expect(health.message).toBe("noop");
  });

  it("should close without error", async () => {
    const provider = new NoopEventsProvider();
    await expect(provider.close()).resolves.toBeUndefined();
  });
});
