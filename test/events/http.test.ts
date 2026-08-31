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

describe("HttpEventsProvider.emit request body", () => {
  const captureBody = async (event: {
    type: string;
    data: Record<string, unknown>;
    idempotencyKey?: string;
  }) => {
    const { HttpEventsProvider } = await import("../../src/events/http");
    const provider = new HttpEventsProvider({
      baseUrl: "https://api.vortex.test",
      apiKey: "test-key",
    });

    let captured: Record<string, unknown> | undefined;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ eventId: "evt-1", timestamp: "2026-08-31T00:00:00Z" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    try {
      await provider.emit(event);
    } finally {
      globalThis.fetch = originalFetch;
    }

    return captured;
  };

  it("forwards idempotencyKey when set", async () => {
    const body = await captureBody({
      type: "test.event",
      data: { foo: "bar" },
      idempotencyKey: "idem-123",
    });

    expect(body?.idempotencyKey).toBe("idem-123");
  });

  it("omits idempotencyKey when not set", async () => {
    const body = await captureBody({ type: "test.event", data: { foo: "bar" } });

    expect(body?.idempotencyKey).toBeUndefined();
  });
});

describe("HttpEventsProvider.listSubscriptions", () => {
  const makePage = (page: number, count: number, total: number) =>
    new Response(
      JSON.stringify({
        nodes: Array.from({ length: count }, (_, i) => ({
          id: `sub-${(page - 1) * 100 + i}`,
          name: `sub-${(page - 1) * 100 + i}`,
        })),
        total,
        page,
        limit: 100,
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  it("pages through every subscription, not just the first page", async () => {
    const { HttpEventsProvider } = await import("../../src/events/http");
    const provider = new HttpEventsProvider({
      baseUrl: "https://api.vortex.test",
      apiKey: "test-key",
    });

    const urls: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      const page = Number(new URL(url).searchParams.get("page"));
      // 150 total across two pages: a full page of 100, then 50
      return makePage(page, page === 1 ? 100 : 50, 150);
    }) as typeof fetch;

    try {
      const subs = await provider.listSubscriptions();
      expect(subs).toHaveLength(150);
      expect(urls).toHaveLength(2);
      expect(urls[0]).toContain("page=1");
      expect(urls[1]).toContain("page=2");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("stops after a single short page", async () => {
    const { HttpEventsProvider } = await import("../../src/events/http");
    const provider = new HttpEventsProvider({
      baseUrl: "https://api.vortex.test",
      apiKey: "test-key",
    });

    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls++;
      return makePage(1, 3, 3);
    }) as typeof fetch;

    try {
      const subs = await provider.listSubscriptions();
      expect(subs).toHaveLength(3);
      expect(calls).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("getTraceHeaders", () => {
  it("generates valid traceparent headers", async () => {
    const { getTraceHeaders } = await import("../../src/util/traceContext");
    const headers = getTraceHeaders();
    expect(headers.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });
});
