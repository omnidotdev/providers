import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { createOidcClient } from "../../src/auth/oidc";

const MOCK_AUTH_URL = "https://auth.example.com";
const MOCK_JWKS_URI = `${MOCK_AUTH_URL}/.well-known/jwks.json`;

const MOCK_DISCOVERY = {
  issuer: MOCK_AUTH_URL,
  jwks_uri: MOCK_JWKS_URI,
};

describe("createOidcClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch and cache OIDC discovery", async () => {
    let fetchCount = 0;
    globalThis.fetch = mock(async () => {
      fetchCount++;
      return new Response(JSON.stringify(MOCK_DISCOVERY), {
        status: 200,
      });
    });

    const client = createOidcClient({ authBaseUrl: MOCK_AUTH_URL });
    const discovery = await client.getDiscovery();

    expect(discovery.issuer).toBe(MOCK_AUTH_URL);
    expect(discovery.jwks_uri).toBe(MOCK_JWKS_URI);
    expect(fetchCount).toBe(1);

    // Second call should use cache
    await client.getDiscovery();
    expect(fetchCount).toBe(1);
  });

  it("should throw on failed OIDC discovery", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("Not Found", { status: 404 });
    });

    const client = createOidcClient({ authBaseUrl: MOCK_AUTH_URL });

    expect(client.getDiscovery()).rejects.toThrow("OIDC discovery failed");
  });

  it("should throw on invalid OIDC discovery document", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const client = createOidcClient({ authBaseUrl: MOCK_AUTH_URL });

    expect(client.getDiscovery()).rejects.toThrow(
      "Invalid OIDC discovery document",
    );
  });

  it("should clear cache", async () => {
    let fetchCount = 0;
    globalThis.fetch = mock(async () => {
      fetchCount++;
      return new Response(JSON.stringify(MOCK_DISCOVERY), {
        status: 200,
      });
    });

    const client = createOidcClient({ authBaseUrl: MOCK_AUTH_URL });

    await client.getDiscovery();
    expect(fetchCount).toBe(1);

    client.clearCache();

    await client.getDiscovery();
    expect(fetchCount).toBe(2);
  });

  it("should create independent clients per authBaseUrl", async () => {
    const urls: string[] = [];
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      urls.push(input.toString());
      return new Response(
        JSON.stringify({
          issuer: "https://auth1.example.com",
          jwks_uri: "https://auth1.example.com/.well-known/jwks.json",
        }),
        { status: 200 },
      );
    });

    const client1 = createOidcClient({
      authBaseUrl: "https://auth1.example.com",
    });
    const client2 = createOidcClient({
      authBaseUrl: "https://auth2.example.com",
    });

    await client1.getDiscovery();
    await client2.getDiscovery();

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("auth1.example.com");
    expect(urls[1]).toContain("auth2.example.com");
  });
});
