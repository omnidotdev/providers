import { describe, expect, it } from "bun:test";

import { checkIdentity } from "./useIdentitySync";

const respond = (status: number, body?: unknown) => async () =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

describe("checkIdentity", () => {
  it("is same when the browser is signed in as the app's account", async () => {
    expect(
      await checkIdentity(
        "https://idp.example.com",
        "u1",
        respond(200, { data: { sub: "u1" } }),
      ),
    ).toBe("same");
  });

  it("is switched when another account is active", async () => {
    expect(
      await checkIdentity(
        "https://idp.example.com",
        "u1",
        respond(200, { data: { sub: "u2" } }),
      ),
    ).toBe("switched");
  });

  it("is signed-out on 401", async () => {
    expect(
      await checkIdentity("https://idp.example.com", "u1", respond(401)),
    ).toBe("signed-out");
  });

  it("is unknown on errors, outages, and odd answers", async () => {
    const idp = "https://idp.example.com";
    expect(await checkIdentity(idp, "u1", respond(404))).toBe("unknown");
    expect(await checkIdentity(idp, "u1", respond(500))).toBe("unknown");
    expect(await checkIdentity(idp, "u1", respond(200, {}))).toBe("unknown");
    expect(
      await checkIdentity(idp, "u1", async () => {
        throw new TypeError("network");
      }),
    ).toBe("unknown");
  });

  it("calls the endpoint with credentials and no cache", async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    await checkIdentity("https://idp.example.com/", "u1", async (url, init) => {
      seen = { url: String(url), init };
      return new Response(JSON.stringify({ data: { sub: "u1" } }));
    });
    expect(seen?.url).toBe("https://idp.example.com/api/session/current");
    expect(seen?.init?.credentials).toBe("include");
    expect(seen?.init?.cache).toBe("no-store");
  });
});
