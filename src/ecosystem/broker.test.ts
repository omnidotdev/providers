import { describe, expect, it } from "bun:test";

import { resolveBuyCheckout, resolveSupportCheckout } from "./broker";

import type { CrystalConnection } from "./crystalConnection";
import type { HaloConnection } from "./haloConnection";

const crystal = (over: Partial<CrystalConnection>): CrystalConnection => ({
  configured: true,
  linkOut: (slug) => `https://crystal.omni.dev/@${slug}`,
  readCreator: async () => null,
  createSupportCheckout: async () => null,
  ...over,
});

const halo = (over: Partial<HaloConnection>): HaloConnection => ({
  configured: true,
  linkOut: (domain) => (domain ? `https://${domain}` : "https://halo.omni.dev"),
  readProduct: async () => null,
  createBuyCheckout: async () => null,
  ...over,
});

describe("resolveSupportCheckout", () => {
  it("brokers a checkout for a payable creator", async () => {
    const conn = crystal({
      readCreator: async () => ({
        organizationId: "org1",
        name: "Ada",
        slug: "ada",
        acceptsPayments: true,
      }),
      createSupportCheckout: async () => ({ url: "https://stripe/session" }),
    });

    const result = await resolveSupportCheckout(conn, {
      slug: "ada",
      amountCents: 500,
      returnBase: "https://site",
    });

    expect(result).toEqual({ url: "https://stripe/session", brokered: true });
  });

  it("degrades to a link-out when the creator is not payable", async () => {
    const conn = crystal({
      readCreator: async () => ({
        organizationId: "org1",
        name: "Ada",
        slug: "ada",
        acceptsPayments: false,
      }),
    });

    const result = await resolveSupportCheckout(conn, {
      slug: "ada",
      amountCents: 500,
      returnBase: "https://site",
    });

    expect(result).toEqual({
      url: "https://crystal.omni.dev/@ada",
      brokered: false,
    });
  });

  it("degrades to a link-out when unresolved (unconfigured)", async () => {
    const result = await resolveSupportCheckout(crystal({}), {
      slug: "ada",
      amountCents: 500,
      returnBase: "https://site",
    });

    expect(result.brokered).toBe(false);
  });
});

describe("resolveBuyCheckout", () => {
  it("brokers a checkout for an active product", async () => {
    const conn = halo({
      readProduct: async () => ({
        productId: "p1",
        title: "Mug",
        active: true,
        storeDomain: "shop.example.com",
      }),
      createBuyCheckout: async () => ({ url: "https://stripe/buy" }),
    });

    const result = await resolveBuyCheckout(conn, {
      productId: "p1",
      returnBase: "https://site",
    });

    expect(result).toEqual({ url: "https://stripe/buy", brokered: true });
  });

  it("degrades to the store link when the product is inactive", async () => {
    const conn = halo({
      readProduct: async () => ({
        productId: "p1",
        title: "Mug",
        active: false,
        storeDomain: "shop.example.com",
      }),
    });

    const result = await resolveBuyCheckout(conn, {
      productId: "p1",
      returnBase: "https://site",
    });

    expect(result).toEqual({
      url: "https://shop.example.com",
      brokered: false,
    });
  });
});
