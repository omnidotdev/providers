import { describe, expect, it } from "bun:test";

import { resolveSubscribe } from "./broker";
import { createHeraldConnection } from "./heraldConnection";

import type { HeraldConnection } from "./heraldConnection";

describe("herald connection", () => {
  it("is unconfigured without an api url + key", async () => {
    const conn = createHeraldConnection({});

    expect(conn.configured).toBe(false);
    expect(await conn.subscribe({ audienceId: "a", email: "x@y.z" })).toEqual({
      ok: false,
    });
  });

  it("subscribes via addContact when configured", async () => {
    const conn = createHeraldConnection({
      apiUrl: "https://herald/graphql",
      apiKey: "k",
      request: (async () => ({
        addContact: { contact: { id: "c1" } },
      })) as never,
    });

    expect(await conn.subscribe({ audienceId: "a", email: "x@y.z" })).toEqual({
      ok: true,
    });
  });
});

describe("resolveSubscribe", () => {
  const herald = (over: Partial<HeraldConnection>): HeraldConnection => ({
    configured: true,
    subscribe: async () => ({ ok: false }),
    ...over,
  });

  it("reports not-configured honestly (no silent drop)", async () => {
    const result = await resolveSubscribe(herald({ configured: false }), {
      audienceId: "a",
      email: "x@y.z",
    });

    expect(result).toEqual({ ok: false, configured: false });
  });

  it("subscribes when configured", async () => {
    const result = await resolveSubscribe(
      herald({ subscribe: async () => ({ ok: true }) }),
      { audienceId: "a", email: "x@y.z" },
    );

    expect(result).toEqual({ ok: true, configured: true });
  });
});
