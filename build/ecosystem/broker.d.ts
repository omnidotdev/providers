import type { CrystalConnection } from "./crystalConnection";
import type { HaloConnection } from "./haloConnection";
import type { HeraldConnection } from "./heraldConnection";
export interface BrokerResult {
    url: string;
    /** true = a real checkout session; false = degraded link-out to the product */
    brokered: boolean;
}
export interface SupportRequest {
    slug: string;
    amountCents: number;
    /** Same-origin base for return URLs (open-redirect defense) */
    returnBase: string;
    email?: string;
    message?: string;
}
/**
 * Resolve a Crystal support checkout, or degrade to a link-out to the creator's
 * Crystal page. Return URLs are built from the caller's own origin.
 */
export declare const resolveSupportCheckout: (conn: CrystalConnection, req: SupportRequest) => Promise<BrokerResult>;
export interface BuyRequest {
    productId: string;
    quantity?: number;
    returnBase: string;
    email?: string;
}
/**
 * Resolve a Halo buy checkout, or degrade to a link-out to the store.
 */
export declare const resolveBuyCheckout: (conn: HaloConnection, req: BuyRequest) => Promise<BrokerResult>;
export interface SubscribeRequest {
    audienceId: string;
    email: string;
}
/**
 * Resolve a Herald email subscription. `configured` is surfaced so the block can
 * tell "not set up" apart from "failed"; either way the caller reports honestly
 * and never pretends a dropped address succeeded.
 */
export declare const resolveSubscribe: (conn: HeraldConnection, req: SubscribeRequest) => Promise<{
    ok: boolean;
    configured: boolean;
}>;
