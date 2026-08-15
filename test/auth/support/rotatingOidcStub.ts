// Stub OIDC provider mirroring Gatekeeper's rotating refresh tokens with a
// theft-detection grace window. Runs in-process via Bun.serve so better-auth's
// server-to-server fetch to the token/userinfo endpoints hits a real network
// socket, exactly as it would against Gatekeeper. Adapted from the Phase 0
// spike (spikes/refresh-rotation/stub-oidc.ts) to emit the namespaced Omni
// organization claim so getAuth's readOrgClaims populates organizations

import { OMNI_CLAIMS_NAMESPACE } from "../../../src/auth/types";

import type { OrganizationClaim } from "../../../src/auth/types";

interface StubOptions {
  // grace window in ms during which replaying an already-rotated refresh token
  // is forgiven (a fresh token is forked) instead of tearing down the family.
  // Mirrors Gatekeeper's grace-reuse patch. Default 30_000 to match prod
  graceMs?: number;
  // lifetime of issued access tokens in seconds. Kept tiny so getAccessToken
  // always sees the token as expired and triggers a refresh
  accessTokenTtlSeconds?: number;
}

interface TokenRecord {
  family: string;
  revoked: boolean;
  revokedAt: number | null;
}

export interface StubServer {
  url: string;
  // observability for assertions
  refreshCalls: RefreshCall[];
  stop: () => void;
}

export interface RefreshCall {
  presented: string;
  outcome: "rotated" | "grace-fork" | "theft-rejected" | "unknown-rejected";
}

// Full Omni organization claim so getAuth hydrates organizations directly from
// the id token with no userinfo round-trip (every display field is present)
const STUB_ORG: OrganizationClaim = {
  id: "org-abc",
  name: "Spike Org",
  slug: "spike-org",
  logo: null,
  type: "team",
  roles: ["owner"],
  teams: [],
};

const b64url = (obj: unknown) =>
  Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Minimal unsigned JWT. The test wires a decode-only OidcClient (no JWKS), so a
// well-formed three-part token carrying sub + email + the namespaced org claim
// is enough
const makeIdToken = () => {
  const header = b64url({ alg: "none", typ: "JWT" });
  const payload = b64url({
    sub: "user-1",
    email: "spike@example.test",
    email_verified: true,
    name: "Spike User",
    picture: "https://example.test/avatar.png",
    [OMNI_CLAIMS_NAMESPACE]: [STUB_ORG],
    iss: "https://stub-oidc.test",
    aud: "spike-client",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  return `${header}.${payload}.stubsignature`;
};

let counter = 0;
const nextId = (prefix: string) => `${prefix}_${++counter}_${Date.now()}`;

export const startStubOidc = (options: StubOptions = {}): StubServer => {
  const graceMs = options.graceMs ?? 30_000;
  const accessTokenTtlSeconds = options.accessTokenTtlSeconds ?? 1;

  // refresh token registry keyed by token string
  const tokens = new Map<string, TokenRecord>();
  const refreshCalls: RefreshCall[] = [];

  const issueTokens = (family: string) => {
    const refreshToken = nextId("rt");
    tokens.set(refreshToken, { family, revoked: false, revokedAt: null });
    return {
      access_token: nextId("at"),
      refresh_token: refreshToken,
      id_token: makeIdToken(),
      token_type: "Bearer",
      expires_in: accessTokenTtlSeconds,
      scope: "openid profile email offline_access organization",
    };
  };

  const tearDownFamily = (family: string) => {
    for (const rec of tokens.values()) {
      if (rec.family === family) {
        rec.revoked = true;
        if (rec.revokedAt === null) rec.revokedAt = Date.now();
      }
    }
  };

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/.well-known/openid-configuration") {
        const base = `http://localhost:${server.port}`;
        return json({
          issuer: base,
          authorization_endpoint: `${base}/authorize`,
          token_endpoint: `${base}/token`,
          userinfo_endpoint: `${base}/userinfo`,
        });
      }

      // Browser-facing authorize. Not strictly exercised by the harness (which
      // calls the callback directly), present for faithfulness
      if (url.pathname === "/authorize") {
        const redirectUri = url.searchParams.get("redirect_uri") ?? "";
        const state = url.searchParams.get("state") ?? "";
        const code = nextId("code");
        const to = new URL(redirectUri);
        to.searchParams.set("code", code);
        to.searchParams.set("state", state);
        return new Response(null, {
          status: 302,
          headers: { location: to.toString() },
        });
      }

      if (url.pathname === "/token" && req.method === "POST") {
        const form = new URLSearchParams(await req.text());
        const grantType = form.get("grant_type");

        if (grantType === "authorization_code") {
          // mint a new token family for a fresh sign-in
          return json(issueTokens(nextId("fam")));
        }

        if (grantType === "refresh_token") {
          const presented = form.get("refresh_token") ?? "";
          const rec = tokens.get(presented);

          if (!rec) {
            refreshCalls.push({ presented, outcome: "unknown-rejected" });
            return json({ error: "invalid_grant" }, 400);
          }

          if (!rec.revoked) {
            // happy path: rotate. Revoke the presented token, issue a fresh one
            // in the same family
            rec.revoked = true;
            rec.revokedAt = Date.now();
            refreshCalls.push({ presented, outcome: "rotated" });
            return json(issueTokens(rec.family));
          }

          // presented token already rotated away. Within the grace window we
          // forgive and fork a fresh token; after it, treat as theft and tear
          // down the whole family
          const sinceRevoke = Date.now() - (rec.revokedAt ?? 0);
          if (sinceRevoke <= graceMs) {
            refreshCalls.push({ presented, outcome: "grace-fork" });
            return json(issueTokens(rec.family));
          }

          tearDownFamily(rec.family);
          refreshCalls.push({ presented, outcome: "theft-rejected" });
          return json({ error: "invalid_grant" }, 400);
        }

        return json({ error: "unsupported_grant_type" }, 400);
      }

      if (url.pathname === "/userinfo") {
        return json({
          sub: "user-1",
          email: "spike@example.test",
          email_verified: true,
          name: "Spike User",
          picture: "https://example.test/avatar.png",
          [OMNI_CLAIMS_NAMESPACE]: [STUB_ORG],
        });
      }

      return new Response("not found", { status: 404 });
    },
  });

  return {
    url: `http://localhost:${server.port}`,
    refreshCalls,
    stop: () => server.stop(true),
  };
};
