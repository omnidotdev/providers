export interface HaloProduct {
  productId: string;
  title: string;
  active: boolean;
  storeDomain?: string;
}

export interface HaloBuyInput {
  productId: string;
  quantity: number;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}

/** Minimal GraphQL transport: run a query with variables, return typed data */
export type GraphqlRequest = <T>(
  query: string,
  variables: Record<string, unknown>,
) => Promise<T>;

export interface HaloConfig {
  apiUrl?: string;
  serviceKey?: string;
  storefrontBase: string;
  request?: GraphqlRequest;
}

export interface HaloConnection {
  configured: boolean;
  readProduct(productId: string): Promise<HaloProduct | null>;
  createBuyCheckout(input: HaloBuyInput): Promise<{ url: string } | null>;
  linkOut(storeDomain?: string): string;
}

const PRODUCT_QUERY = `query Product($rowId: UUID!) {
  product(rowId: $rowId) { rowId title status store { domain } }
}`;

const QUICK_BUY = `mutation QuickBuy($input: QuickBuyCheckoutInput!) {
  quickBuyCheckout(input: $input) { checkoutUrl }
}`;

/**
 * Halo (commerce) connection over its service-key GraphQL API. `product` reads
 * are public only when status is "active"; `quickBuyCheckout` is Halo's
 * documented external-surface buy mutation. Fail-soft throughout.
 */
export const createHaloConnection = (config: HaloConfig): HaloConnection => {
  const request = config.request;
  const configured = Boolean(config.apiUrl && request);

  return {
    configured,

    linkOut: (storeDomain) =>
      storeDomain ? `https://${storeDomain}` : config.storefrontBase,

    readProduct: async (productId) => {
      if (!request) return null;

      try {
        const data = await request<{
          product?: {
            rowId: string;
            title: string;
            status: string;
            store?: { domain?: string };
          };
        }>(PRODUCT_QUERY, { rowId: productId });

        const product = data.product;

        if (!product) return null;

        return {
          productId: product.rowId,
          title: product.title,
          active: product.status === "active",
          storeDomain: product.store?.domain,
        };
      } catch {
        return null;
      }
    },

    createBuyCheckout: async (input) => {
      if (!request) return null;

      try {
        const data = await request<{
          quickBuyCheckout?: { checkoutUrl?: string };
        }>(QUICK_BUY, {
          input: {
            productId: input.productId,
            quantity: input.quantity,
            email: input.email,
            successUrl: input.successUrl,
            cancelUrl: input.cancelUrl,
          },
        });

        const url = data.quickBuyCheckout?.checkoutUrl;

        return url ? { url } : null;
      } catch {
        return null;
      }
    },
  };
};
