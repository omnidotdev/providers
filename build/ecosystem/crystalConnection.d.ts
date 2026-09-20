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
    createSupportCheckout(input: CrystalSupportInput): Promise<{
        url: string;
    } | null>;
    linkOut(slug: string): string;
}
/**
 * Crystal (sponsorship/support) connection. Public REST: `GET /creators/:slug`
 * and `POST /checkout/donation`. Every path is fail-soft (returns null / a
 * link-out) so a support block never dead-ends.
 */
export declare const createCrystalConnection: (config: CrystalConfig) => CrystalConnection;
