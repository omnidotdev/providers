import { describe, expect, it, mock } from "bun:test";

import { createGetAuth } from "./getAuth";

import type { AuthCache } from "./cache";
import type { BetterAuthApi, SetCookieFn } from "./getAuth";
import type { OidcClient } from "./oidc";

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
}) => {
  const setCookieCalls: Array<{ name: string; value: string }> = [];

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
    verifyIdToken: mock(async () => ({ sub: "idp-sub-123" })),
  } as unknown as OidcClient;

  const authCache = {
    cookieName: "test-cache",
    cookieTtlSeconds: 3600,
    encrypt: mock(async () => "encrypted-blob"),
    decrypt: mock(async () => null),
  } as unknown as AuthCache;

  const setCookie: SetCookieFn = (name, value) => {
    setCookieCalls.push({ name, value });
  };

  return { authApi, oidc, authCache, setCookie, setCookieCalls };
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
