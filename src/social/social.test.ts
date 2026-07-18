import { afterEach, describe, expect, it, mock } from "bun:test";

import { GatekeeperSocialProvider } from "./gatekeeper";
import { createSocialProvider } from "./index";

const BASE_URL = "https://gatekeeper.example.com";
const SERVICE_KEY = "svc-test-key";
const USER_ID = "user_123";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Stub global fetch with a JSON response and capture the requests made. */
const stubFetch = (
  status: number,
  json: unknown,
): { calls: Array<{ url: string; init?: RequestInit }> } => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = mock(
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });

      return new Response(JSON.stringify(json), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  ) as unknown as typeof fetch;

  return { calls };
};

/** Stub global fetch so it throws, simulating a connection failure. */
const stubFetchNetworkError = (): { calls: () => number } => {
  let i = 0;
  globalThis.fetch = mock(async () => {
    i += 1;
    throw new Error("ECONNREFUSED");
  }) as unknown as typeof fetch;

  return { calls: () => i };
};

const sampleConnections = [
  {
    platform: "threads",
    handle: "coop_bri",
    profileUrl: "https://threads.net/@coop_bri",
    avatarUrl: "https://cdn.example.com/a.png",
    status: "connected",
    verified: true,
    connectedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    platform: "bluesky",
    handle: null,
    profileUrl: null,
    avatarUrl: null,
    status: "pending",
    verified: false,
    connectedAt: "2026-07-02T00:00:00.000Z",
  },
];

const makeProvider = () =>
  new GatekeeperSocialProvider({
    baseUrl: BASE_URL,
    serviceKey: SERVICE_KEY,
  });

describe("GatekeeperSocialProvider.getConnections", () => {
  it("maps the bare-array payload in full and hits the read endpoint", async () => {
    // Gatekeeper returns a bare JSON array, so this is the real contract
    const { calls } = stubFetch(200, sampleConnections);
    const provider = makeProvider();

    const result = await provider.getConnections(USER_ID);

    expect(result).toEqual(sampleConnections);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      `${BASE_URL}/social/connections/read?userId=${USER_ID}`,
    );
  });

  it("tolerates a { connections } wrapper payload", async () => {
    stubFetch(200, { connections: sampleConnections });
    const provider = makeProvider();

    const result = await provider.getConnections(USER_ID);

    expect(result).toHaveLength(2);
    expect(result[0]?.platform).toBe("threads");
  });

  it("sends the bearer service key and requests JSON", async () => {
    const { calls } = stubFetch(200, { connections: sampleConnections });
    const provider = makeProvider();

    await provider.getConnections(USER_ID);

    const headers = calls[0]?.init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${SERVICE_KEY}`);
    expect(headers.Accept).toBe("application/json");
  });

  it("URL-encodes the user id", async () => {
    const { calls } = stubFetch(200, { connections: [] });
    const provider = makeProvider();

    await provider.getConnections("user/with space");

    expect(calls[0]?.url).toBe(
      `${BASE_URL}/social/connections/read?userId=user%2Fwith%20space`,
    );
  });

  it("fails open with [] on a non-2xx response", async () => {
    stubFetch(503, { error: "gatekeeper down" });
    const provider = makeProvider();

    const result = await provider.getConnections(USER_ID);

    expect(result).toEqual([]);
  });

  it("fails open with [] on a network error", async () => {
    stubFetchNetworkError();
    const provider = makeProvider();

    const result = await provider.getConnections(USER_ID);

    expect(result).toEqual([]);
  });
});

describe("GatekeeperSocialProvider.getConnection", () => {
  it("returns the matching platform connection", async () => {
    stubFetch(200, { connections: sampleConnections });
    const provider = makeProvider();

    const result = await provider.getConnection(USER_ID, "bluesky");

    expect(result?.platform).toBe("bluesky");
    expect(result?.handle).toBeNull();
  });

  it("returns null when no connection matches the platform", async () => {
    stubFetch(200, { connections: sampleConnections });
    const provider = makeProvider();

    const result = await provider.getConnection(USER_ID, "youtube");

    expect(result).toBeNull();
  });

  it("fails open with null on a network error", async () => {
    stubFetchNetworkError();
    const provider = makeProvider();

    const result = await provider.getConnection(USER_ID, "threads");

    expect(result).toBeNull();
  });
});

describe("createSocialProvider", () => {
  it("returns a GatekeeperSocialProvider instance", () => {
    const provider = createSocialProvider({
      baseUrl: BASE_URL,
      serviceKey: SERVICE_KEY,
    });

    expect(provider).toBeInstanceOf(GatekeeperSocialProvider);
  });
});
