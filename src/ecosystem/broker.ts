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
export const resolveSupportCheckout = async (
  conn: CrystalConnection,
  req: SupportRequest,
): Promise<BrokerResult> => {
  const creator = await conn.readCreator(req.slug);

  if (creator?.acceptsPayments && req.amountCents >= 100) {
    const checkout = await conn.createSupportCheckout({
      organizationId: creator.organizationId,
      amountCents: req.amountCents,
      successUrl: `${req.returnBase}?support=success`,
      cancelUrl: `${req.returnBase}?support=cancel`,
      email: req.email,
      message: req.message,
    });

    if (checkout) return { url: checkout.url, brokered: true };
  }

  return { url: conn.linkOut(req.slug), brokered: false };
};

export interface BuyRequest {
  productId: string;
  quantity?: number;
  returnBase: string;
  email?: string;
}

/**
 * Resolve a Halo buy checkout, or degrade to a link-out to the store.
 */
export const resolveBuyCheckout = async (
  conn: HaloConnection,
  req: BuyRequest,
): Promise<BrokerResult> => {
  const product = await conn.readProduct(req.productId);

  if (product?.active) {
    const checkout = await conn.createBuyCheckout({
      productId: product.productId,
      quantity: req.quantity ?? 1,
      email: req.email,
      successUrl: `${req.returnBase}?buy=success`,
      cancelUrl: `${req.returnBase}?buy=cancel`,
    });

    if (checkout) return { url: checkout.url, brokered: true };
  }

  return { url: conn.linkOut(product?.storeDomain), brokered: false };
};

export interface SubscribeRequest {
  audienceId: string;
  email: string;
}

/**
 * Resolve a Herald email subscription. `configured` is surfaced so the block can
 * tell "not set up" apart from "failed"; either way the caller reports honestly
 * and never pretends a dropped address succeeded.
 */
export const resolveSubscribe = async (
  conn: HeraldConnection,
  req: SubscribeRequest,
): Promise<{ ok: boolean; configured: boolean }> => {
  if (!conn.configured) return { ok: false, configured: false };

  const result = await conn.subscribe({
    audienceId: req.audienceId,
    email: req.email,
  });

  return { ok: result.ok, configured: true };
};
