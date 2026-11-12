import { describe, expect, it } from "bun:test";

import {
  createEntitlementCapResolver,
  createStaticCapResolver,
} from "./capResolver";

import type { EntitlementsResponse } from "./interface";

const entitlements = (
  value: string | null,
  featureKey = "included_credits",
): EntitlementsResponse => ({
  billingAccountId: "acct_1",
  entityType: "user",
  entityId: "user_1",
  entitlementVersion: 1,
  entitlements:
    value === null
      ? []
      : [
          {
            id: "ent_1",
            productId: "facet",
            featureKey,
            value,
            source: "subscription",
            validFrom: "2026-11-01T00:00:00Z",
            validUntil: null,
          },
        ],
});

describe("createStaticCapResolver", () => {
  it("always returns the static cap", async () => {
    const resolve = createStaticCapResolver(100);
    expect(await resolve("anyone")).toBe(100);
  });
});

describe("createEntitlementCapResolver", () => {
  it("returns the entity's included_credits entitlement", async () => {
    const resolve = createEntitlementCapResolver({
      billing: { getEntitlements: async () => entitlements("2000") },
      productId: "facet",
      fallbackCredits: 100,
    });
    expect(await resolve("user_1")).toBe(2000);
  });

  it("falls back to the static cap when no billing account exists", async () => {
    const resolve = createEntitlementCapResolver({
      billing: { getEntitlements: async () => null },
      productId: "facet",
      fallbackCredits: 100,
    });
    expect(await resolve("user_1")).toBe(100);
  });

  it("falls back when the entitlement is absent", async () => {
    const resolve = createEntitlementCapResolver({
      billing: { getEntitlements: async () => entitlements(null) },
      productId: "facet",
      fallbackCredits: 100,
    });
    expect(await resolve("user_1")).toBe(100);
  });

  it("falls back when the entitlement value is unparseable", async () => {
    const resolve = createEntitlementCapResolver({
      billing: { getEntitlements: async () => entitlements("unlimited") },
      productId: "facet",
      fallbackCredits: 100,
    });
    expect(await resolve("user_1")).toBe(100);
  });

  it("falls back (never crashes or grants unbounded) when billing throws", async () => {
    const resolve = createEntitlementCapResolver({
      billing: {
        getEntitlements: async () => {
          throw new Error("aether down");
        },
      },
      productId: "facet",
      fallbackCredits: 100,
    });
    expect(await resolve("user_1")).toBe(100);
  });

  it("honors a custom feature key", async () => {
    const resolve = createEntitlementCapResolver({
      billing: {
        getEntitlements: async () => entitlements("500", "ai_monthly_credits"),
      },
      productId: "keystone",
      featureKey: "ai_monthly_credits",
      fallbackCredits: 50,
    });
    expect(await resolve("user_1")).toBe(500);
  });
});
