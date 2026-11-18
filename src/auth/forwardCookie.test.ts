import { describe, expect, it } from "bun:test";

import { hostSetCookieForwarder } from "./forwardCookie";

const rotated = [
  "omni.account_data=chunk0; Path=/; HttpOnly; SameSite=Lax",
  "omni.account_data.1=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
];

describe("hostSetCookieForwarder", () => {
  it("appends through appendResponseHeader, not a getResponseHeaders snapshot", () => {
    // Current TanStack Start: getResponseHeaders returns a fresh read-only
    // snapshot, so appending to it never reaches the response
    const appended: [string, string | string[]][] = [];
    const server = {
      getResponseHeaders: () => new Headers(),
      appendResponseHeader: (name: string, value: string | string[]) => {
        appended.push([name, value]);
      },
    };

    const forward = hostSetCookieForwarder(server);
    for (const raw of rotated) forward?.(raw);

    expect(appended).toEqual(rotated.map((raw) => ["set-cookie", raw]));
  });

  it("falls back to the live response headers on hosts without appendResponseHeader", () => {
    const headers = new Headers();
    const forward = hostSetCookieForwarder({
      getResponseHeaders: () => headers,
    });
    for (const raw of rotated) forward?.(raw);

    expect(headers.getSetCookie()).toEqual(rotated);
  });

  it("returns null when the host exposes neither helper", () => {
    expect(hostSetCookieForwarder({})).toBeNull();
  });
});
