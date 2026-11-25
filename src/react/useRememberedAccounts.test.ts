import { describe, expect, it } from "bun:test";

import {
  fetchRememberedAccounts,
  otherRememberedAccounts,
} from "./useRememberedAccounts";

const respond = (status: number, body?: unknown) => async () =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const ada = {
  handle: "h-ada",
  name: "Ada",
  email: "ada@example.com",
  image: null,
};
const grace = {
  handle: "h-grace",
  name: "Grace",
  email: "Grace@Example.com",
  image: "https://img.example.com/g.png",
};

describe("fetchRememberedAccounts", () => {
  it("returns the listed accounts", async () => {
    expect(
      await fetchRememberedAccounts(
        "https://idp.example.com",
        respond(200, { data: { accounts: [ada, grace] } }),
      ),
    ).toEqual([ada, grace]);
  });

  it("keeps only the fields an account menu needs", async () => {
    const [account] = await fetchRememberedAccounts(
      "https://idp.example.com",
      respond(200, {
        data: { accounts: [{ ...ada, token: "secret", sub: "user-1" }] },
      }),
    );
    expect(account).toEqual(ada);
  });

  it("is empty when signed out, on errors, and on odd answers", async () => {
    const idp = "https://idp.example.com";
    expect(await fetchRememberedAccounts(idp, respond(401))).toEqual([]);
    expect(await fetchRememberedAccounts(idp, respond(403))).toEqual([]);
    expect(await fetchRememberedAccounts(idp, respond(500))).toEqual([]);
    expect(await fetchRememberedAccounts(idp, respond(200, {}))).toEqual([]);
    expect(
      await fetchRememberedAccounts(
        idp,
        respond(200, { data: { accounts: [{ name: "No handle" }, ada] } }),
      ),
    ).toEqual([ada]);
    expect(
      await fetchRememberedAccounts(idp, async () => {
        throw new TypeError("network");
      }),
    ).toEqual([]);
  });

  it("calls the endpoint with credentials and no cache", async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    await fetchRememberedAccounts(
      "https://idp.example.com/",
      async (url, init) => {
        seen = { url: String(url), init };
        return new Response(null, { status: 401 });
      },
    );
    expect(seen?.url).toBe("https://idp.example.com/api/session/accounts");
    expect(seen?.init?.credentials).toBe("include");
    expect(seen?.init?.cache).toBe("no-store");
  });
});

describe("otherRememberedAccounts", () => {
  it("leaves out the app's own account, matched by email", () => {
    expect(otherRememberedAccounts([ada, grace], "ADA@example.com")).toEqual([
      grace,
    ]);
    expect(otherRememberedAccounts([ada, grace], "grace@example.com")).toEqual([
      ada,
    ]);
  });

  it("keeps every account without a current email", () => {
    expect(otherRememberedAccounts([ada, grace], null)).toEqual([ada, grace]);
  });
});
