import type { EntitlementsResponse } from "./interface";

/**
 * Check if a current count is within an entitlement limit.
 * Standalone function (not a method on BillingProvider) since it
 * composes entitlements with a current count only the product knows.
 *
 * @param entitlements - Entitlements response from the billing provider
 * @param featureKey - The limit key to check (e.g., "max_projects")
 * @param currentCount - Current count of the resource
 * @param defaultLimits - Product-specific default limits by tier
 * @returns true if within limit, false if over limit
 */
const isWithinLimit = (
  entitlements: EntitlementsResponse | null,
  featureKey: string,
  currentCount: number,
  defaultLimits?: Record<string, Record<string, number>>,
): boolean => {
  if (!entitlements) {
    // No entitlements available — check default free tier limits
    const freeLimit = defaultLimits?.[featureKey]?.free;
    if (freeLimit === undefined || freeLimit === -1) return true;
    return currentCount < freeLimit;
  }

  // Find the entitlement value for this feature
  const entitlement = entitlements.entitlements.find(
    (e) => e.featureKey === featureKey,
  );

  if (entitlement?.value) {
    const limit = Number(entitlement.value);

    // -1 or "unlimited" means no limit
    if (limit === -1 || Number.isNaN(limit)) return true;

    return currentCount < limit;
  }

  // No specific entitlement found — look up tier-based default
  if (defaultLimits) {
    const tierEntitlement = entitlements.entitlements.find(
      (e) => e.featureKey === "tier",
    );
    const tier = tierEntitlement?.value ?? "free";
    const limit = defaultLimits[featureKey]?.[tier];

    if (limit === undefined || limit === -1) return true;
    return currentCount < limit;
  }

  // No limit found anywhere — allow
  return true;
};

export { isWithinLimit };
