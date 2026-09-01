// Minimal better-auth instance mirroring herald-app's real auth.ts config on
// the pinned better-auth 1.6.11. Drives the genericOAuth sign-in flow in-process
// via auth.handler and exposes a tiny cookie jar for the rotation assertions.
// Adapted from the Phase 0 spike (spikes/refresh-rotation/harness.ts)

import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

const AUTH_SECRET = "spike-secret-0000000000000000000000000000";
export const BASE_URL = "http://localhost:4000";

interface BuildOpts {
  oidcUrl: string;
}

// mirror of herald prod: OAuth tokens live in an encrypted browser cookie
// (storeAccountCookie:true), the stateless mode where the rotated refresh token
// only survives if its Set-Cookie is forwarded to the browser
export const buildAuth = (opts: BuildOpts) =>
  betterAuth({
    baseURL: BASE_URL,
    basePath: "/api/auth",
    secret: AUTH_SECRET,
    trustedOrigins: [BASE_URL],
    emailAndPassword: { enabled: false },
    advanced: {
      cookiePrefix: "herald",
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30,
        // encrypted JWE cookie cache, matching herald
        strategy: "jwe",
        refreshCache: true,
      },
    },
    account: {
      storeAccountCookie: true,
    },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: "omni",
            clientId: "spike-client",
            clientSecret: "spike-secret",
            authorizationUrl: `${opts.oidcUrl}/authorize`,
            tokenUrl: `${opts.oidcUrl}/token`,
            userInfoUrl: `${opts.oidcUrl}/userinfo`,
            scopes: [
              "openid",
              "profile",
              "email",
              "offline_access",
              "organization",
            ],
            accessType: "offline",
            pkce: true,
            prompt: "login",
            mapProfileToUser: (profile) => ({
              name: profile.name,
              email: profile.email,
              emailVerified:
                typeof profile.email_verified === "boolean"
                  ? profile.email_verified
                  : undefined,
              image:
                typeof profile.picture === "string"
                  ? profile.picture
                  : undefined,
            }),
          },
        ],
      }),
    ],
  });

export type Auth = ReturnType<typeof buildAuth>;

// ---------------------------------------------------------------------------
// cookie jar
// ---------------------------------------------------------------------------

// Extremely small cookie jar: name -> value. Enough to round-trip better-auth's
// state, session, and account cookies across handler calls
export class CookieJar {
  private store = new Map<string, string>();

  // Apply a single raw Set-Cookie header (a deletion when the value is empty or
  // Max-Age=0). This is the exact shape getAuth's forwardSetCookie hook hands
  // back, so the test can wire the hook straight into the jar
  applyRaw(raw: string) {
    const first = raw.split(";")[0];
    const eq = first.indexOf("=");
    if (eq === -1) return;
    const name = first.slice(0, eq).trim();
    const value = first.slice(eq + 1).trim();
    if (value === "" || /max-age=0/i.test(raw)) {
      this.store.delete(name);
    } else {
      this.store.set(name, value);
    }
  }

  applySetCookies(headers: Headers) {
    for (const raw of headers.getSetCookie()) this.applyRaw(raw);
  }

  header(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  names(): string[] {
    return [...this.store.keys()];
  }

  clone(): CookieJar {
    const j = new CookieJar();
    j.store = new Map(this.store);
    return j;
  }

  // Build a Request carrying the jar's cookies, as a browser would send them
  request(): Request {
    return new Request(`${BASE_URL}/`, {
      headers: { cookie: this.header() },
    });
  }
}

// ---------------------------------------------------------------------------
// sign-in driver
// ---------------------------------------------------------------------------

// Drives the full genericOAuth sign-in through auth.handler, returning a cookie
// jar holding the session + account cookies (as a browser would hold them)
export const signIn = async (auth: Auth): Promise<CookieJar> => {
  const jar = new CookieJar();

  // 1. kick off sign-in: better-auth stores state + pkce verifier in a cookie
  const signInRes = await auth.handler(
    new Request(`${BASE_URL}/api/auth/sign-in/social`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: BASE_URL,
      },
      body: JSON.stringify({ provider: "omni", callbackURL: "/" }),
    }),
  );
  jar.applySetCookies(signInRes.headers);
  const { url } = (await signInRes.json()) as { url: string };
  const state = new URL(url).searchParams.get("state");
  if (!state) throw new Error("no state on authorization url");

  // 2. simulate the IdP redirect back to the callback. better-auth exchanges the
  // code at the stub /token endpoint, fetches userinfo, creates the session, and
  // sets the session + account cookies
  const callbackRes = await auth.handler(
    new Request(
      `${BASE_URL}/api/auth/callback/omni?code=spike-code&state=${state}`,
      {
        method: "GET",
        headers: { cookie: jar.header() },
      },
    ),
  );
  jar.applySetCookies(callbackRes.headers);

  return jar;
};
