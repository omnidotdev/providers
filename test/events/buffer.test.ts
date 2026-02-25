import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { EventBuffer } from "../../src/events/buffer";

import type { EmitResult, EventInput } from "../../src/events/interface";

const makeEvent = (type: string): EventInput => ({
  type,
  data: { key: "value" },
});

describe("EventBuffer", () => {
  let flushed: EventInput[][];
  let flushFn: (events: EventInput[]) => Promise<EmitResult[]>;
  let buffer: EventBuffer;

  beforeEach(() => {
    flushed = [];
    flushFn = async (events) => {
      flushed.push(events);
      return events.map(() => ({
        eventId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      }));
    };
  });

  afterEach(async () => {
    await buffer?.close();
  });

  it("flushes when maxSize is reached", async () => {
    buffer = new EventBuffer({ maxSize: 2, flushIntervalMs: 60_000 }, flushFn);

    await buffer.add(makeEvent("a"));
    expect(flushed).toHaveLength(0);

    await buffer.add(makeEvent("b"));
    expect(flushed).toHaveLength(1);
    expect(flushed[0]).toHaveLength(2);
  });

  it("flushes on interval", async () => {
    buffer = new EventBuffer({ maxSize: 100, flushIntervalMs: 50 }, flushFn);

    await buffer.add(makeEvent("a"));
    expect(flushed).toHaveLength(0);

    await new Promise((r) => setTimeout(r, 100));
    expect(flushed).toHaveLength(1);
    expect(flushed[0]).toHaveLength(1);
  });

  it("drains on close", async () => {
    buffer = new EventBuffer(
      { maxSize: 100, flushIntervalMs: 60_000 },
      flushFn,
    );

    await buffer.add(makeEvent("a"));
    await buffer.add(makeEvent("b"));
    expect(flushed).toHaveLength(0);

    await buffer.close();
    expect(flushed).toHaveLength(1);
    expect(flushed[0]).toHaveLength(2);
  });

  it("does not flush when empty", async () => {
    buffer = new EventBuffer({ maxSize: 10, flushIntervalMs: 50 }, flushFn);
    await new Promise((r) => setTimeout(r, 100));
    expect(flushed).toHaveLength(0);
  });

  it("manual flush drains the buffer", async () => {
    buffer = new EventBuffer(
      { maxSize: 100, flushIntervalMs: 60_000 },
      flushFn,
    );

    await buffer.add(makeEvent("a"));
    await buffer.flush();

    expect(flushed).toHaveLength(1);
    expect(flushed[0]).toHaveLength(1);
  });
});
