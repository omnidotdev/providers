import { afterEach, describe, expect, it, mock } from "bun:test";

import { createPrismClient } from "./client";

const COLLECTOR_URL = "https://prism.example.com";
const PRODUCT = "launchpad";

const originalFetch = globalThis.fetch;
const originalSendBeacon = globalThis.navigator?.sendBeacon;

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (originalSendBeacon) {
    globalThis.navigator.sendBeacon = originalSendBeacon;
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
});

/** Stub global fetch and capture the requests made */
const stubFetch = (): { calls: Array<{ url: string; init?: RequestInit }> } => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = mock(
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });

      return new Response(JSON.stringify({ accepted: 1 }), { status: 202 });
    },
  ) as unknown as typeof fetch;

  return { calls };
};

/** Parse a stubbed request body back into the collect batch shape */
const parseBody = (init?: RequestInit) =>
  JSON.parse(String(init?.body)) as {
    product: string;
    events: Array<Record<string, unknown>>;
  };

describe("createPrismClient", () => {
  it("track enqueues without sending, flush POSTs the batch to /collect", async () => {
    const { calls } = stubFetch();
    const client = createPrismClient({
      collectorUrl: COLLECTOR_URL,
      product: PRODUCT,
    });

    client.track("pageview");
    client.track("signup", { plan: "pro" });

    // nothing sent until flush
    expect(calls).toHaveLength(0);

    client.flush();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${COLLECTOR_URL}/collect`);
    expect(calls[0]?.init?.method).toBe("POST");

    const headers = calls[0]?.init?.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");

    const batch = parseBody(calls[0]?.init);
    expect(batch.product).toBe(PRODUCT);
    expect(batch.events).toHaveLength(2);
    expect(batch.events[0]?.name).toBe("pageview");
    expect(batch.events[1]?.name).toBe("signup");
    expect(batch.events[1]?.properties).toEqual({ plan: "pro" });
  });

  it("stamps path, referrer, and a stable per-tab sessionId, never a visitor id", async () => {
    const { calls } = stubFetch();
    const client = createPrismClient({
      collectorUrl: COLLECTOR_URL,
      product: PRODUCT,
    });

    client.track("pageview");
    client.track("pageview");
    client.flush();

    const batch = parseBody(calls[0]?.init);
    const [first, second] = batch.events;

    // path comes from window.location (happy-dom serves "/")
    expect(typeof first?.path).toBe("string");
    // sessionId is generated once and reused across events
    expect(first?.sessionId).toBeTruthy();
    expect(second?.sessionId).toBe(first?.sessionId as string);

    // the client must never send a visitor identifier, ip, or cookie
    expect(first).not.toHaveProperty("visitorId");
    expect(first).not.toHaveProperty("ip");
    expect(first).not.toHaveProperty("country");
  });

  it("flushes automatically once the batch hits the size cap", async () => {
    const { calls } = stubFetch();
    const client = createPrismClient({
      collectorUrl: COLLECTOR_URL,
      product: PRODUCT,
      maxBatchSize: 3,
    });

    client.track("a");
    client.track("b");
    expect(calls).toHaveLength(0);

    client.track("c");
    expect(calls).toHaveLength(1);

    const batch = parseBody(calls[0]?.init);
    expect(batch.events).toHaveLength(3);
  });

  it("flush is a no-op when the queue is empty", () => {
    const { calls } = stubFetch();
    const client = createPrismClient({
      collectorUrl: COLLECTOR_URL,
      product: PRODUCT,
    });

    client.flush();

    expect(calls).toHaveLength(0);
  });

  it("uses navigator.sendBeacon with the batch on tab hide", () => {
    stubFetch();
    const beaconCalls: Array<{ url: string; body: unknown }> = [];
    globalThis.navigator.sendBeacon = mock((url: string, body?: BodyInit) => {
      beaconCalls.push({ url, body });

      return true;
    }) as unknown as typeof navigator.sendBeacon;

    const client = createPrismClient({
      collectorUrl: COLLECTOR_URL,
      product: PRODUCT,
    });

    client.track("pageview");

    // simulate the tab being backgrounded
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(beaconCalls).toHaveLength(1);
    expect(beaconCalls[0]?.url).toBe(`${COLLECTOR_URL}/collect`);

    const batch = JSON.parse(String(beaconCalls[0]?.body)) as {
      product: string;
      events: unknown[];
    };
    expect(batch.product).toBe(PRODUCT);
    expect(batch.events).toHaveLength(1);
  });

  it("is a graceful no-op when collectorUrl is falsy (no fetch, no throw)", () => {
    const { calls } = stubFetch();
    const client = createPrismClient({ collectorUrl: "", product: PRODUCT });

    expect(() => {
      client.track("pageview");
      client.flush();
    }).not.toThrow();

    expect(calls).toHaveLength(0);
  });

  it("is SSR-safe: no window means a no-op client that never throws", () => {
    const { calls } = stubFetch();

    const savedWindow = globalThis.window;
    // simulate a server render where window is absent
    // @ts-expect-error deliberately removing the global for the SSR path
    globalThis.window = undefined;

    try {
      const client = createPrismClient({
        collectorUrl: COLLECTOR_URL,
        product: PRODUCT,
      });

      expect(() => {
        client.track("pageview");
        client.flush();
      }).not.toThrow();

      expect(calls).toHaveLength(0);
    } finally {
      globalThis.window = savedWindow;
    }
  });
});
