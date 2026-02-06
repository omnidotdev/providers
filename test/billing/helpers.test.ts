import { describe, expect, it } from "bun:test";

import { isWithinLimit } from "../../src/billing/helpers";

import type { EntitlementsResponse } from "../../src/billing/interface";

const createEntitlements = (
  features: Array<{ key: string; value: string }>,
): EntitlementsResponse => ({
  billingAccountId: "ba-1",
  entityType: "organization",
  entityId: "org-1",
  entitlementVersion: 1,
  entitlements: features.map((f) => ({
    id: `ent-${f.key}`,
    productId: "runa",
    featureKey: f.key,
    value: f.value,
    source: "subscription",
    validFrom: "2024-01-01T00:00:00Z",
    validUntil: null,
  })),
});

describe("isWithinLimit", () => {
  it("should allow when entitlement value is -1 (unlimited)", () => {
    const ent = createEntitlements([{ key: "max_projects", value: "-1" }]);
    expect(isWithinLimit(ent, "max_projects", 9999)).toBe(true);
  });

  it("should allow when current count is below limit", () => {
    const ent = createEntitlements([{ key: "max_projects", value: "10" }]);
    expect(isWithinLimit(ent, "max_projects", 5)).toBe(true);
  });

  it("should deny when current count equals limit", () => {
    const ent = createEntitlements([{ key: "max_projects", value: "10" }]);
    expect(isWithinLimit(ent, "max_projects", 10)).toBe(false);
  });

  it("should deny when current count exceeds limit", () => {
    const ent = createEntitlements([{ key: "max_projects", value: "10" }]);
    expect(isWithinLimit(ent, "max_projects", 15)).toBe(false);
  });

  it("should use tier-based defaults when no specific entitlement", () => {
    const ent = createEntitlements([{ key: "tier", value: "free" }]);
    const defaultLimits = {
      max_projects: { free: 2, basic: 10, team: -1, enterprise: -1 },
    };

    expect(isWithinLimit(ent, "max_projects", 1, defaultLimits)).toBe(true);
    expect(isWithinLimit(ent, "max_projects", 2, defaultLimits)).toBe(false);
  });

  it("should use unlimited tier-based defaults correctly", () => {
    const ent = createEntitlements([{ key: "tier", value: "enterprise" }]);
    const defaultLimits = {
      max_projects: { free: 2, basic: 10, team: -1, enterprise: -1 },
    };

    expect(isWithinLimit(ent, "max_projects", 99999, defaultLimits)).toBe(true);
  });

  it("should use free tier defaults when entitlements are null", () => {
    const defaultLimits = {
      max_projects: { free: 2, basic: 10 },
    };

    expect(isWithinLimit(null, "max_projects", 1, defaultLimits)).toBe(true);
    expect(isWithinLimit(null, "max_projects", 2, defaultLimits)).toBe(false);
  });

  it("should allow when no entitlements and no defaults", () => {
    expect(isWithinLimit(null, "max_projects", 100)).toBe(true);
  });

  it("should allow when entitlements exist but feature not found and no defaults", () => {
    const ent = createEntitlements([{ key: "other_feature", value: "5" }]);
    expect(isWithinLimit(ent, "max_projects", 100)).toBe(true);
  });
});
