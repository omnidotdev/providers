import { describe, expect, it } from "bun:test";

import {
  generateTraceparent,
  getTraceHeaders,
} from "../../src/util/traceContext";

describe("generateTraceparent", () => {
  it("returns a valid W3C traceparent string", () => {
    const tp = generateTraceparent();
    // Format: 00-{32 hex}-{16 hex}-01
    expect(tp).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("generates unique trace IDs", () => {
    const a = generateTraceparent();
    const b = generateTraceparent();
    expect(a).not.toBe(b);
  });
});

describe("getTraceHeaders", () => {
  it("returns an object with traceparent", () => {
    const headers = getTraceHeaders();
    expect(headers.traceparent).toBeDefined();
    expect(headers.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });
});
