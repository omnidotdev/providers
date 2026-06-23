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
}) => {
  const setCookieCalls: Array<{ name: string; value: string }> = [];
  const encryptCalls: CachedAuthData[] = [];

  const authApi = {
    getSession: mock(async () => overrides.session),
    getAccessToken: mock(async () => ({
      accessToken: "access-token",
      idToken: "id-token",
    })),
    refreshToken: mock(async () => null),
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
