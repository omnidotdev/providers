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
/**
 * Default markup from real model spend to billable credits, shared across the
 * fleet. A credit is a retail unit, not raw cost: 2.0 yields ~50% gross margin
 * over model spend (the standard 1.3-3x range for resold inference). Products
 * meter AI usage against this; a live product mid-transition can pass a lower
 * markup until it grandfathers existing subscribers. See
 * plans/2026-11-03-fleet-credit-economics-markup.md
 */
declare const DEFAULT_CREDIT_COGS_MARKUP = 2;
/**
 * Convert real model spend (US cents) into billable credits, where 1 credit is
 * a retail unit worth 1 US cent at a 1.0 markup. Rounded up so any nonzero cost
 * charges at least one credit. The markup (default 2.0) carries gross margin, so
 * the included allowance is not sold at cost.
 *
 * This is the one fleet definition of the cost-to-credit conversion; product
 * services should call it rather than hand-rolling `ceil(costCents * markup)`.
 * The spend-safety breaker (where a product has one) still tracks REAL cents, so
 * the absolute money ceiling is independent of the markup.
 *
 * @param costCents - Real model spend for the operation, in US cents
 * @param markup - Cost-to-credit markup; defaults to DEFAULT_CREDIT_COGS_MARKUP
 * @returns Billable credits (a non-negative integer)
 */
declare const creditsFromCostCents: (costCents: number, markup?: number) => number;
export { DEFAULT_CREDIT_COGS_MARKUP, creditsFromCostCents, isWithinLimit };
