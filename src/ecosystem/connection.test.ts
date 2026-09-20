import { describe, expect, it } from "bun:test";

import { createCrystalConnection } from "./crystalConnection";
import { createHaloConnection } from "./haloConnection";

describe("crystal connection", () => {
  it("is unconfigured and returns null without an apiUrl", async () => {
    const conn = createCrystalConnection({
      appUrl: "https://crystal.omni.dev",
    });

    expect(conn.configured).toBe(false);
    expect(await conn.readCreator("ada")).toBeNull();
    expect(conn.linkOut("ada")).toBe("https://crystal.omni.dev/@ada");
  });

  it("parses a creator from the REST response", async () => {
    const conn = createCrystalConnection({
      apiUrl: "https://crystal.api",
      appUrl: "https://crystal.omni.dev",
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            organization: {
              id: "org1",
              name: "Ada",
              slug: "ada",
              acceptsPayments: true,
            },
          }),
          { status: 200 },
        )) as unknown as typeof fetch,
    });

    expect(await conn.readCreator("ada")).toEqual({
      organizationId: "org1",
      name: "Ada",
      slug: "ada",
      acceptsPayments: true,
    });
  });

  it("returns null on a non-ok response (fail-soft)", async () => {
    const conn = createCrystalConnection({
      apiUrl: "https://crystal.api",
      appUrl: "https://crystal.omni.dev",
      fetchImpl: (async () =>
        new Response("nope", { status: 500 })) as unknown as typeof fetch,
    });

    expect(await conn.readCreator("ada")).toBeNull();
  });
});

describe("halo connection", () => {
  it("is unconfigured without a request transport", async () => {
    const conn = createHaloConnection({
      storefrontBase: "https://halo.omni.dev",
    });

    expect(conn.configured).toBe(false);
    expect(await conn.readProduct("p1")).toBeNull();
    expect(conn.linkOut()).toBe("https://halo.omni.dev");
    expect(conn.linkOut("shop.example.com")).toBe("https://shop.example.com");
  });

  it("parses an active product from GraphQL", async () => {
    const conn = createHaloConnection({
      apiUrl: "https://halo.api/graphql",
      serviceKey: "k",
      storefrontBase: "https://halo.omni.dev",
      request: (async () => ({
        product: {
          rowId: "p1",
          title: "Mug",
          status: "active",
          store: { domain: "shop.example.com" },
        },
      })) as never,
    });

    expect(await conn.readProduct("p1")).toEqual({
      productId: "p1",
      title: "Mug",
      active: true,
      storeDomain: "shop.example.com",
    });
  });
});
