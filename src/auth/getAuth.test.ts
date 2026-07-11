import { describe, expect, it, mock } from "bun:test";

import { createGetAuth } from "./getAuth";
import { OMNI_CLAIMS_NAMESPACE } from "./types";

import type { AuthCache, CachedAuthData } from "./cache";
import type { BetterAuthApi, SetCookieFn } from "./getAuth";
import type { OidcClient } from "./oidc";
import type { OrganizationClaim } from "./types";

/** Build a session whose customSession fields can be overridden per test. */
const makeSession = (
  user: Record<string, unknown>,
): Awaited<ReturnType<BetterAuthApi["getSession"]>> =>
  ({
    user: { id: "ba-id", email: "user@example.com", ...user },
    session: { token: "sess", expiresAt: new Date().toISOString() },
  }) as Awaited<ReturnType<BetterAuthApi["getSession"]>>;

const makeConfig = (overrides: {
  session: Awaited<ReturnType<BetterAuthApi["getSession"]>>;
  resolveRowId?: (params: {
    identityProviderId: string;
    accessToken: string;
    user: { id: string; email: string };
  }) => Promise<string | null>;
  /** Claims returned by the mocked OIDC ID-token verification */
  idTokenClaims?: Record<string, unknown>;
  /** Claims returned by the mocked OIDC userinfo fetch */
  userInfoClaims?: Record<string, unknown>;
  /** Override the mocked Better Auth getAccessToken behavior */
  getAccessTokenImpl?: () => Promise<{
    accessToken?: string;
    idToken?: string | null;
  } | null>;
  /** Override the mocked Better Auth refreshToken behavior */
  refreshTokenImpl?: () => Promise<{
    accessToken?: string;
    idToken?: string | null;
  } | null>;
}) => {
  const setCookieCalls: Array<{ name: string; value: string }> = [];
  const encryptCalls: CachedAuthData[] = [];

  const authApi = {
    getSession: mock(async () => overrides.session),
    getAccessToken: mock(
      overrides.getAccessTokenImpl ??
        (async () => ({
          accessToken: "access-token",
          idToken: "id-token",
        })),
    ),
    refreshToken: mock(overrides.refreshTokenImpl ?? (async () => null)),
    signOut: mock(async () => undefined),
  } as unknown as BetterAuthApi;

  const oidc = {
    verifyIdToken: mock(
      async () => overrides.idTokenClaims ?? { sub: "idp-sub-123" },
    ),
    fetchUserInfo: mock(
      async () => overrides.userInfoClaims ?? { sub: "idp-sub-123" },
    ),
  } as unknown as OidcClient;

  const authCache = {
    cookieName: "test-cache",
    cookieTtlSeconds: 3600,
    encrypt: mock(async (data: CachedAuthData) => {
      encryptCalls.push(data);
      return "encrypted-blob";
    }),
    decrypt: mock(async () => null),
  } as unknown as AuthCache;

  const setCookie: SetCookieFn = (name, value) => {
    setCookieCalls.push({ name, value });
  };

  return { authApi, oidc, authCache, setCookie, setCookieCalls, encryptCalls };
};

const request = new Request("https://app.example.com");

describe("createGetAuth rowId resolution", () => {
  it("resolves rowId on a cached session whose rowId is still missing (retry path)", async () => {
    // Session was cached previously (identityProviderId present) but rowId never
    // resolved. The resolver now succeeds; getAuth must retry and populate it
    // rather than trusting the half-populated cache forever.
    const resolveRowId = mock(async () => "resolved-row-uuid");
    const cfg = makeConfig({
      session: makeSession({
        identityProviderId: "idp-sub-123",
        rowId: null,
        organizations: [],
      }),
      resolveRowId,
    });

    const getAuth = createGetAuth({ ...cfg, resolveRowId });
    const result = await getAuth(request);

    expect(resolveRowId).toHaveBeenCalledTimes(1);
    expect(result?.user.rowId).toBe("resolved-row-uuid");
  });

  it("does not set rowId when the resolver returns null, leaving it retryable", async () => {
    const resolveRowId = mock(async () => null);
    const cfg = makeConfig({
      session: makeSession({
        identityProviderId: "idp-sub-123",
        rowId: null,
        organizations: [],
      }),
      resolveRowId,
    });

    const getAuth = createGetAuth({ ...cfg, resolveRowId });
    const result = await getAuth(request);

    expect(resolveRowId).toHaveBeenCalledTimes(1);
    // unresolved rowId stays falsy (null/undefined), so the consuming app keeps
    // treating the user as needing resolution rather than locking them out
    expect(result?.user.rowId).toBeFalsy();
    // identity is still cached so OIDC verify can be skipped next time
    expect(cfg.setCookieCalls.at(-1)?.name).toBe("test-cache");
  });

  it("resolves rowId on first login (cache miss)", async () => {
    const resolveRowId = mock(async () => "fresh-row-uuid");
    const cfg = makeConfig({
      session: makeSession({}),
      resolveRowId,
    });

    const getAuth = createGetAuth({ ...cfg, resolveRowId });
    const result = await getAuth(request);

    expect(resolveRowId).toHaveBeenCalledTimes(1);
    expect(result?.user.rowId).toBe("fresh-row-uuid");
    expect(result?.user.identityProviderId).toBe("idp-sub-123");
  });

  it("skips resolution entirely when no resolver is configured", async () => {
    const cfg = makeConfig({ session: makeSession({}) });

    const getAuth = createGetAuth(cfg);
    const result = await getAuth(request);

    expect(result?.user.rowId).toBeUndefined();
  });
});

describe("createGetAuth organization handling", () => {
  const ORGS: OrganizationClaim[] = [
    {
      id: "org-1",
      name: "Acme",
      slug: "acme",
      type: "team",
      roles: ["admin"],
      teams: [],
    },
  ];

  it("derives organizations from the verified ID token", async () => {
    const cfg = makeConfig({
      session: makeSession({}),
      idTokenClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
    });

    const getAuth = createGetAuth(cfg);
    const result = await getAuth(request);

    expect(result?.organizations).toEqual(ORGS);
  });

  it("hydrates rich organizations from userinfo when the token claim is slim (ids only)", async () => {
    // Post-slim token shape: the org claim carries only ids. createGetAuth must
    // hydrate the rich details (name/slug/logo/roles/teams) from userinfo so UIs
    // keep working.
    const SLIM = [{ id: "org-1" }];
    const cfg = makeConfig({
      session: makeSession({}),
      idTokenClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: SLIM },
      userInfoClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
    });

    const getAuth = createGetAuth(cfg);
    const result = await getAuth(request);

    expect(result?.organizations).toEqual(ORGS);
    expect(
      (cfg.oidc as unknown as { fetchUserInfo: ReturnType<typeof mock> })
        .fetchUserInfo,
    ).toHaveBeenCalledTimes(1);
  });

  it("uses rich token organizations directly without a userinfo round-trip", async () => {
    const cfg = makeConfig({
      session: makeSession({}),
      idTokenClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
      userInfoClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
    });

    const getAuth = createGetAuth(cfg);
    const result = await getAuth(request);

    expect(result?.organizations).toEqual(ORGS);
    expect(
      (cfg.oidc as unknown as { fetchUserInfo: ReturnType<typeof mock> })
        .fetchUserInfo,
    ).not.toHaveBeenCalled();
  });

  it("recovers organizations from userinfo when a refresh returns no id token", async () => {
    // The id token is only issued at login; a refresh-token grant returns just
    // an access token. Without a userinfo fallback the dashboard loses every
    // workspace after the first token refresh.
    const cfg = makeConfig({
      session: makeSession({ identityProviderId: "idp-sub-123" }),
      getAccessTokenImpl: async () => ({ accessToken: "access-token" }),
      userInfoClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
    });

    const getAuth = createGetAuth(cfg);
    const result = await getAuth(request);

    expect(result?.organizations).toEqual(ORGS);
    expect(
      (cfg.oidc as unknown as { fetchUserInfo: ReturnType<typeof mock> })
        .fetchUserInfo,
    ).toHaveBeenCalledTimes(1);
  });

  it("ignores userinfo org claims when the subject does not match (OIDC 5.3.2)", async () => {
    // A userinfo response for a different subject must never populate this
    // session's organizations, even if the access token somehow resolved it.
    const cfg = makeConfig({
      session: makeSession({ identityProviderId: "idp-sub-123" }),
      getAccessTokenImpl: async () => ({ accessToken: "access-token" }),
      userInfoClaims: { sub: "attacker-sub", [OMNI_CLAIMS_NAMESPACE]: ORGS },
    });

    const getAuth = createGetAuth(cfg);
    const result = await getAuth(request);

    expect(result?.organizations).toEqual([]);
  });

  it("never writes organizations into the cache cookie (keeps headers bounded)", async () => {
    const cfg = makeConfig({
      session: makeSession({}),
      idTokenClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
      resolveRowId: async () => "row-uuid",
    });

    const getAuth = createGetAuth({
      ...cfg,
      resolveRowId: async () => "row-uuid",
    });
    await getAuth(request);

    expect(cfg.encryptCalls.length).toBeGreaterThan(0);
    for (const call of cfg.encryptCalls) {
      expect((call as Record<string, unknown>).organizations).toBeUndefined();
    }
  });
});

describe("createGetAuth userinfo org cache", () => {
  const ORGS: OrganizationClaim[] = [
    {
      id: "org-1",
      name: "Acme",
      slug: "acme",
      type: "team",
      roles: [],
      teams: [],
    },
  ];
  const SLIM = [{ id: "org-1" }];

  const fetchSpy = (cfg: ReturnType<typeof makeConfig>) =>
    (cfg.oidc as unknown as { fetchUserInfo: ReturnType<typeof mock> })
      .fetchUserInfo;

  it("caches userinfo hydration across requests within the TTL (one fetch)", async () => {
    const cfg = makeConfig({
      session: makeSession({}),
      idTokenClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: SLIM },
      userInfoClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
    });

    const getAuth = createGetAuth(cfg);
    const a = await getAuth(request);
    const b = await getAuth(request);

    expect(a?.organizations).toEqual(ORGS);
    expect(b?.organizations).toEqual(ORGS);
    // Second request must be served from cache, not a second userinfo round-trip
    expect(fetchSpy(cfg)).toHaveBeenCalledTimes(1);
  });

  it("refetches userinfo after the cache TTL expires", async () => {
    let clock = 1_000;
    const cfg = makeConfig({
      session: makeSession({}),
      idTokenClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: SLIM },
      userInfoClaims: { sub: "idp-sub-123", [OMNI_CLAIMS_NAMESPACE]: ORGS },
    });

    const getAuth = createGetAuth({
      ...cfg,
      orgCacheTtlMs: 60_000,
      now: () => clock,
    });
    await getAuth(request);
    clock += 60_001;
    await getAuth(request);

    expect(fetchSpy(cfg)).toHaveBeenCalledTimes(2);
  });
});

describe("createGetAuth concurrent refresh handling", () => {
  /** APIError wrapper Better Auth throws when a rotated refresh token races */
  const failedTokenError = () =>
    Object.assign(new Error("Failed to get a valid access token"), {
      body: { code: "FAILED_TO_GET_ACCESS_TOKEN" },
    });

  it("single-flights the token fetch across a concurrent request burst", async () => {
    // An SSR page fires many parallel requests for the SAME session. Each
    // triggers getAuth, but only ONE token fetch may hit Better Auth/Gatekeeper.
    // Firing N refreshes is exactly what races refresh-token rotation and logs
    // users out, so concurrent getAuth calls for one session must share a fetch.
    let resolveGate: () => void = () => {};
    const gate = new Promise<void>((r) => {
      resolveGate = r;
    });

    const cfg = makeConfig({
      session: makeSession({ identityProviderId: "idp-sub-123" }),
      getAccessTokenImpl: async () => {
        await gate;
        return { accessToken: "access-token", idToken: "id-token" };
      },
    });

    const getAuth = createGetAuth(cfg);
    const inflight = [getAuth(request), getAuth(request), getAuth(request)];
    // let all three reach the shared token fetch before it settles
    await Promise.resolve();
    resolveGate();
    const results = await Promise.all(inflight);

    expect(results.every((r) => r?.accessToken === "access-token")).toBe(true);
    const getAccessToken = (
      cfg.authApi as unknown as { getAccessToken: ReturnType<typeof mock> }
    ).getAccessToken;
    expect(getAccessToken).toHaveBeenCalledTimes(1);
  });

  it("degrades instead of signing out when a refresh loses the rotation race", async () => {
    // The BA session itself is valid (getSession succeeded); only the OAuth
    // token refresh failed because a sibling request already rotated it. This
    // must NOT destroy the session: return it token-less and let the natural
    // 401 -> re-auth path recover, rather than force-logging-out a live user.
    const cfg = makeConfig({
      session: makeSession({ identityProviderId: "idp-sub-123" }),
      getAccessTokenImpl: async () => {
        throw failedTokenError();
      },
      refreshTokenImpl: async () => {
        throw failedTokenError();
      },
    });

    const getAuth = createGetAuth(cfg);
    const result = await getAuth(request);

    // session preserved, just without a fresh access token
    expect(result).not.toBeNull();
    expect(result?.accessToken).toBeUndefined();
    expect(result?.user.identityProviderId).toBe("idp-sub-123");
    // never tears the session down on a single transient failure
    const signOut = (
      cfg.authApi as unknown as { signOut: ReturnType<typeof mock> }
    ).signOut;
    expect(signOut).not.toHaveBeenCalled();
    // and never clears the auth cache cookie
    expect(cfg.setCookieCalls.some((c) => c.value === "")).toBe(false);
  });
});
