/**
 * Tier-aware credit cap resolver, sourced from Aether entitlements (shared
 * fleet primitive).
 *
 * The managed usage cap for an entity is its `included_credits` entitlement for
 * a product, which Aether syncs from the omni-api catalog `operationalLimits`.
 * An entity that upgrades gets the larger cap without a redeploy (the billing
 * webhook invalidates the cached entitlement on change).
 *
 * The resolver degrades safely: any billing outage, a missing entitlement, or
 * an unparseable value falls back to a static cap, so a product never crashes
 * and never hands out an unbounded cap on error. Entitlements are cached inside
 * the billing provider, so this reads through that cache rather than keeping its
 * own.
 *
 * Lifted from facet-api's local resolver into @omnidotdev/providers and
 * generalized over product/entity/feature so every AI product degrades on the
 * same shape. See plans/2026-11-11-ai-credits-fleet-pattern-design.md
 */
import type { BillingProvider } from "./interface";
/** Resolve the monthly managed credit cap for an entity (keyed by its id). */
type CapResolver = (entityId: string) => Promise<number>;
interface EntitlementCapResolverConfig {
    /** Billing provider (Aether) that serves entitlements. */
    billing: Pick<BillingProvider, "getEntitlements">;
    /** Catalog product id whose entitlements set the cap. */
    productId: string;
    /** Static fallback cap used when billing is unreachable or has no entitlement. */
    fallbackCredits: number;
    /** Entitlement feature key to read (default `included_credits`). */
    featureKey?: string;
    /** Entity type the cap is keyed on (default `user`). */
    entityType?: string;
}
/**
 * Build a cap resolver that reads an entity's credit-allowance entitlement for a
 * product from Aether, falling back to the static cap on any failure or absence.
 */
declare const createEntitlementCapResolver: ({ billing, productId, fallbackCredits, featureKey, entityType, }: EntitlementCapResolverConfig) => CapResolver;
/**
 * Cap resolver that always returns the static cap, used when billing is not
 * configured so the service still boots and enforces the fallback cap.
 */
declare const createStaticCapResolver: (capCredits: number) => CapResolver;
export type { CapResolver, EntitlementCapResolverConfig };
export { createEntitlementCapResolver, createStaticCapResolver };
