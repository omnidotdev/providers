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
declare const isWithinLimit: (entitlements: EntitlementsResponse | null, featureKey: string, currentCount: number, defaultLimits?: Record<string, Record<string, number>>) => boolean;
export { isWithinLimit };
