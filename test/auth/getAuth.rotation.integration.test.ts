// Integration test for the refresh-token rotation cookie-drop bug (herald
// "No workspaces yet"). Unlike the unit tests in src/auth/getAuth.test.ts,
// which MOCK authApi and therefore cannot see the rotated Set-Cookie, this
// wires the REAL better-auth 1.6.11 genericOAuth flow through createGetAuth
// against a rotating OIDC stub with a theft-detection grace window.
//
// It proves the two halves of the fix:
//  - WITHOUT forwardSetCookie the rotated (chunked) account cookie is dropped,
//    so past the grace window the pre-rotation refresh token is replayed, the
//    issuer tears down the family, getAccessToken throws
//    FAILED_TO_GET_ACCESS_TOKEN and organizations comes back empty
//  - WITH forwardSetCookie re-applying every chunk into the jar, the browser
//    always holds the freshest refresh token and the session stays healthy

import { describe, expect, it } from "bun:test";

import { createGetAuth } from "../../src/auth/getAuth";
import { buildAuth, signIn } from "./support/betterAuthHarness";
import { startStubOidc } from "./support/rotatingOidcStub";

import type { AuthCache } from "../../src/auth/cache";
import type { OidcClient } from "../../src/auth/oidc";
import type { UserInfoClaims } from "../../src/auth/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Decode-only OIDC client. The stub mints unsigned id tokens (the rotation bug
// is about cookie forwarding, not JWKS), so verifyIdToken just decodes the
// payload; fetchUserInfo hits the stub's /userinfo endpoint
const makeDecodeOidc = (stubUrl: string): OidcClient => ({
  verifyIdToken: async (token: string) => {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    return payload as UserInfoClaims;
  },
  fetchUserInfo: async (accessToken: string) => {
    const res = await fetch(`${stubUrl}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return (await res.json()) as UserInfoClaims;
  },
  getDiscovery: async () => ({ issuer: stubUrl, jwks_uri: `${stubUrl}/jwks` }),
  getJwks: async () => {
    throw new Error("not used");
  },
  clearCache: () => {},
});

// Minimal in-memory AuthCache so we exercise the real getAuth path without
// wiring the encrypted-cookie cache (AUTH_SECRET); this test targets the
// token/cookie rotation path, not the row-id cache
const authCache: AuthCache = {
  encrypt: async (data) => JSON.stringify(data),
  decrypt: async (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  cookieName: "herald_rowid_cache",
  cookieTtlSeconds: 60,
};

describe("getAuth refresh-token rotation cookie forwarding (integration)", () => {
  it("WITHOUT forwardSetCookie: the dropped rotated cookie poisons the session past the grace window (repro)", async () => {
    const oidc = startStubOidc({ graceMs: 50, accessTokenTtlSeconds: 1 });
    const auth = buildAuth({ oidcUrl: oidc.url });
    try {
      const jar = await signIn(auth);
      expect(jar.names()).toContain("herald.account_data");

      const getAuth = createGetAuth({
        authApi: auth.api as never,
        oidc: makeDecodeOidc(oidc.url),
        authCache,
        setCookie: () => {},
        providerId: "omni",
        // no forwardSetCookie: the rotated account cookie is dropped
      });

      // first request refreshes: the stub rotates rt0 -> rt1 and better-auth
      // emits the rotated account cookie, which we DISCARD (jar not mutated)
      const first = await getAuth(jar.request());
      expect(first?.organizations.map((o) => o.id)).toEqual(["org-abc"]);
      expect(first?.accessToken).toBeString();
      expect(oidc.refreshCalls.at(-1)?.outcome).toBe("rotated");

      // let the grace window elapse, then replay the ORIGINAL (pre-rotation) jar
      await sleep(120);
      const second = await getAuth(jar.request());

      // the stub treated the stale refresh token as theft and tore the family
      // down; getAccessToken threw FAILED_TO_GET_ACCESS_TOKEN, getAuth degraded
      // to a session with no access token and no organizations ("No workspaces")
      expect(oidc.refreshCalls.at(-1)?.outcome).toBe("theft-rejected");
      expect(second?.accessToken).toBeUndefined();
      expect(second?.organizations).toEqual([]);
    } finally {
      oidc.stop();
    }
  });

  it("WITH forwardSetCookie: forwarding every rotated chunk keeps the session healthy past the grace window (fix)", async () => {
    const oidc = startStubOidc({ graceMs: 50, accessTokenTtlSeconds: 1 });
    const auth = buildAuth({ oidcUrl: oidc.url });
    try {
      const jar = await signIn(auth);

      // capture every raw Set-Cookie the fix forwards, and re-apply it to the
      // jar exactly as a browser would persist it before the next request
      const forwarded: string[] = [];
      const getAuth = createGetAuth({
        authApi: auth.api as never,
        oidc: makeDecodeOidc(oidc.url),
        authCache,
        setCookie: () => {},
        providerId: "omni",
        forwardSetCookie: (raw) => {
          forwarded.push(raw);
          jar.applyRaw(raw);
        },
      });

      const first = await getAuth(jar.request());
      expect(first?.organizations.map((o) => o.id)).toEqual(["org-abc"]);
      expect(first?.accessToken).toBeString();
      expect(oidc.refreshCalls.at(-1)?.outcome).toBe("rotated");

      // the account cookie is CHUNKED: the fix must forward EVERY chunk verbatim
      const accountChunks = forwarded.filter((c) =>
        c.startsWith("herald.account_data"),
      );
      expect(accountChunks.length).toBeGreaterThanOrEqual(2);

      // past the grace window: because the rotated cookie was forwarded, the jar
      // now carries the NEW refresh token, so this refresh rotates cleanly
      // instead of being rejected as theft
      await sleep(120);
      const second = await getAuth(jar.request());

      expect(oidc.refreshCalls.at(-1)?.outcome).toBe("rotated");
      expect(second?.accessToken).toBeString();
      expect(second?.organizations.map((o) => o.id)).toEqual(["org-abc"]);
    } finally {
      oidc.stop();
    }
  });

  it("forwards Set-Cookie chunk DELETIONS verbatim (not just the live chunks)", async () => {
    const oidc = startStubOidc({ graceMs: 30_000, accessTokenTtlSeconds: 1 });
    const auth = buildAuth({ oidcUrl: oidc.url });
    try {
      const jar = await signIn(auth);

      const forwarded: string[] = [];
      const getAuth = createGetAuth({
        authApi: auth.api as never,
        oidc: makeDecodeOidc(oidc.url),
        authCache,
        setCookie: () => {},
        providerId: "omni",
        forwardSetCookie: (raw) => {
          forwarded.push(raw);
          jar.applyRaw(raw);
        },
      });

      await getAuth(jar.request());

      // the forwarded set matches better-auth's emitted set exactly, including
      // any deletion cookies (empty value / Max-Age=0) for chunks no longer
      // needed. Assert a deletion was among the forwarded headers
      const deletions = forwarded.filter(
        (c) =>
          c.startsWith("herald.account_data") &&
          (/=;|=\s*;/.test(c) || /max-age=0/i.test(c)),
      );
      expect(deletions.length).toBeGreaterThanOrEqual(1);
    } finally {
      oidc.stop();
    }
  });
});
