export interface CrystalCreator {
  organizationId: string;
  name: string;
  slug: string;
  acceptsPayments: boolean;
}

export interface CrystalSupportInput {
  organizationId: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
  email?: string;
  message?: string;
}

export interface CrystalConfig {
  apiUrl?: string;
  appUrl: string;
  fetchImpl?: typeof fetch;
}

export interface CrystalConnection {
  configured: boolean;
  readCreator(slug: string): Promise<CrystalCreator | null>;
  createSupportCheckout(
    input: CrystalSupportInput,
  ): Promise<{ url: string } | null>;
  linkOut(slug: string): string;
}

/**
 * Crystal (sponsorship/support) connection. Public REST: `GET /creators/:slug`
 * and `POST /checkout/donation`. Every path is fail-soft (returns null / a
 * link-out) so a support block never dead-ends.
 */
export const createCrystalConnection = (
  config: CrystalConfig,
): CrystalConnection => {
  const call = config.fetchImpl ?? fetch;

  return {
    configured: Boolean(config.apiUrl),

    linkOut: (slug) => `${config.appUrl}/@${slug}`,

    readCreator: async (slug) => {
      if (!config.apiUrl) return null;

      try {
        const res = await call(
          `${config.apiUrl}/creators/${encodeURIComponent(slug)}`,
        );

        if (!res.ok) return null;

        const data = (await res.json()) as {
          organization?: {
            id: string;
            name: string;
            slug: string;
            acceptsPayments?: boolean;
          };
        };

        const org = data.organization;

        if (!org) return null;

        return {
          organizationId: org.id,
          name: org.name,
          slug: org.slug,
          acceptsPayments: Boolean(org.acceptsPayments),
        };
      } catch {
        return null;
      }
    },

    createSupportCheckout: async (input) => {
      if (!config.apiUrl) return null;

      try {
        const res = await call(`${config.apiUrl}/checkout/donation`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) return null;

        const data = (await res.json()) as { url?: string };

        return data.url ? { url: data.url } : null;
      } catch {
        return null;
      }
    },
  };
};
