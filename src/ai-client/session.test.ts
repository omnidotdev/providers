import { describe, expect, test } from "bun:test";

import { createManagedAiAuth } from "./session";

import type { KeyValueStore, ManagedAiAuthConfig } from "./session";

/** In-memory KeyValueStore for tests. */
const memStore = (): KeyValueStore => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
};

/** A base config with in-memory stores and a captured navigate, overridable per test. */
const makeConfig = (
  overrides: Partial<ManagedAiAuthConfig> = {},
): { config: ManagedAiAuthConfig; navigated: string[] } => {
  const navigated: string[] = [];
  const config: ManagedAiAuthConfig = {
    authBaseUrl: "https://identity.omni.dev",
    clientId: "client-1",
    resolveRedirectUri: () => "https://app.omni.dev/auth/callback",
    resolveReturnTo: () => "https://app.omni.dev/studio",
    navigate: (url) => navigated.push(url),
    tokenStore: memStore(),
    flowStore: memStore(),
    now: () => 1_000_000,
    ...overrides,
  };
  return { config, navigated };
};

describe("createManagedAiAuth", () => {
  test("reports not-configured and no-ops sign-in without a base URL", async () => {
    const { config, navigated } = makeConfig({ authBaseUrl: undefined });
    const auth = createManagedAiAuth(config);
    expect(auth.isConfigured()).toBe(false);
    await auth.signIn();
    expect(navigated).toHaveLength(0);
  });

  test("sign-in stores the flow and navigates to a valid authorize URL", async () => {
    const { config, navigated } = makeConfig();
    const auth = createManagedAiAuth(config);

    await auth.signIn();

    expect(navigated).toHaveLength(1);
    const url = new URL(navigated[0]!);
    expect(url.pathname).toBe("/oauth2/authorize");
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("prompt")).toBe("login");

    // The in-flight flow (verifier + state) is persisted with the matching state
    const flowRaw = config.flowStore.getItem("omni:ai-auth-flow:v1");
    expect(flowRaw).toBeTruthy();
    const flow = JSON.parse(flowRaw as string);
    expect(flow.state).toBe(url.searchParams.get("state"));
    expect(typeof flow.verifier).toBe("string");
    expect(flow.returnTo).toBe("https://app.omni.dev/studio");
  });

  test("completeCallback rejects a state mismatch and never exchanges", async () => {
    let fetched = false;
    const { config } = makeConfig({
      fetchImpl: (async () => {
        fetched = true;
        return new Response("{}", { status: 200 });
      }) as unknown as typeof fetch,
    });
    const auth = createManagedAiAuth(config);
    await auth.signIn(); // stores a flow with some state

    const result = await auth.completeCallback("?code=abc&state=not-the-state");
    expect(result).toEqual({ ok: false, error: "state_mismatch" });
    expect(fetched).toBe(false);
  });

  test("completeCallback exchanges the code and stores a usable token", async () => {
    let capturedState = "";
    const { config } = makeConfig({
      navigate: () => {},
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({ access_token: "tok-123", expires_in: 3600 }),
          { status: 200 },
        )) as unknown as typeof fetch,
    });
    const auth = createManagedAiAuth(config);
    await auth.signIn();
    capturedState = JSON.parse(
      config.flowStore.getItem("omni:ai-auth-flow:v1") as string,
    ).state;

    const result = await auth.completeCallback(
      `?code=the-code&state=${capturedState}`,
    );
    expect(result).toEqual({
      ok: true,
      returnTo: "https://app.omni.dev/studio",
    });
    expect(auth.isSignedIn()).toBe(true);
    expect(await auth.getAccessToken()).toBe("tok-123");
  });

  test("a token past its lifetime (with skew) reads as signed-out", async () => {
    // now() is fixed at 1_000_000; a 1s token minus 5s skew is already expired
    const { config } = makeConfig({
      navigate: () => {},
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({ access_token: "tok-xyz", expires_in: 1 }),
          { status: 200 },
        )) as unknown as typeof fetch,
    });
    const auth = createManagedAiAuth(config);
    await auth.signIn();
    const state = JSON.parse(
      config.flowStore.getItem("omni:ai-auth-flow:v1") as string,
    ).state;
    await auth.completeCallback(`?code=c&state=${state}`);

    expect(auth.isSignedIn()).toBe(false);
    expect(await auth.getAccessToken()).toBeNull();
  });

  test("signOut clears the token and notifies subscribers", async () => {
    const { config } = makeConfig({
      navigate: () => {},
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({ access_token: "tok", expires_in: 3600 }),
          { status: 200 },
        )) as unknown as typeof fetch,
    });
    const auth = createManagedAiAuth(config);

    let notifications = 0;
    auth.subscribe(() => {
      notifications += 1;
    });

    await auth.signIn();
    const state = JSON.parse(
      config.flowStore.getItem("omni:ai-auth-flow:v1") as string,
    ).state;
    await auth.completeCallback(`?code=c&state=${state}`); // notify #1
    expect(auth.isSignedIn()).toBe(true);

    await auth.signOut(); // notify #2
    expect(auth.isSignedIn()).toBe(false);
    expect(notifications).toBe(2);
  });
});
