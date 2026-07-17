/**
 * Public product catalog client.
 *
 * omni-api owns the catalog (DB-synced, filtered to public entities on its
 * public GraphQL surface). This fetches that surface and normalizes it into
 * flat arrays every catalog-driven surface (the marketing site, the Omniverse
 * visualizer, the CLI registry) can render, so each stops hand-rolling the
 * query, types, and GraphQL-to-flat mapping.
 *
 * The API already filters `products`, `productLinks`, and `bundles` to public
 * entities, so no filtering happens here beyond dropping realms that carry no
 * product. Callers own their own fallback (e.g. a committed snapshot) since
 * this throws on a failed fetch.
 */
/** The public catalog surface. `products` is `is_public`-filtered server-side. */
export declare const PUBLIC_CATALOG_QUERY = "{\n  realms(first: 100) { nodes { slug name icon tagline description } }\n  products(first: 200) {\n    nodes {\n      slug name icon description tagline websiteUrl docsUrl license\n      selfHostable releaseDate status realm { slug }\n      productDeploymentMethods { nodes { deploymentMethod { slug } } }\n    }\n  }\n  bundles(first: 50) {\n    nodes {\n      slug name description appGrants monthlyPrice yearlyPrice\n      monthlyCreditAllowance\n    }\n  }\n  productLinks(first: 1000) {\n    nodes {\n      slug sourceProduct { slug } targetProduct { slug } description status\n      productLinkRelations { nodes { relationType { slug } } }\n    }\n  }\n}";
export interface PublicRealm {
    slug: string;
    name: string;
    icon?: string;
    tagline?: string;
    description?: string;
}
export interface PublicProduct {
    id: string;
    name: string;
    icon?: string;
    realm: string | null;
    description?: string;
    tagline?: string;
    websiteUrl?: string;
    docsUrl?: string;
    license?: string;
    selfHostable?: boolean;
    /** ISO release date. Absent means the product has not launched yet. */
    releaseDate?: string;
    /** Lifecycle status, e.g. "active" or "coming_soon". */
    status?: string;
    deploymentMethods: string[];
}
export interface PublicBundle {
    slug: string;
    name: string;
    description?: string;
    appGrants: Record<string, string>;
    monthlyPrice: number;
    yearlyPrice: number;
    monthlyCreditAllowance: number;
}
export interface PublicConnection {
    id: string;
    source: string;
    target: string;
    relations: string[];
    description?: string;
    status?: string;
}
export interface PublicCatalog {
    realms: PublicRealm[];
    products: PublicProduct[];
    bundles: PublicBundle[];
    connections: PublicConnection[];
}
type Nodes<T> = {
    nodes: T[];
};
interface CatalogGqlData {
    realms: Nodes<{
        slug: string;
        name: string;
        icon?: string | null;
        tagline?: string | null;
        description?: string | null;
    }>;
    products: Nodes<{
        slug: string;
        name: string;
        icon?: string | null;
        description?: string | null;
        tagline?: string | null;
        websiteUrl?: string | null;
        docsUrl?: string | null;
        license?: string | null;
        selfHostable?: boolean | null;
        releaseDate?: string | null;
        status?: string | null;
        realm?: {
            slug: string;
        } | null;
        productDeploymentMethods: Nodes<{
            deploymentMethod?: {
                slug: string;
            } | null;
        }>;
    }>;
    bundles: Nodes<{
        slug: string;
        name: string;
        description?: string | null;
        appGrants: Record<string, string>;
        monthlyPrice: number;
        yearlyPrice: number;
        monthlyCreditAllowance?: string | number | null;
    }>;
    productLinks: Nodes<{
        slug: string;
        sourceProduct?: {
            slug: string;
        } | null;
        targetProduct?: {
            slug: string;
        } | null;
        description?: string | null;
        status?: string | null;
        productLinkRelations: Nodes<{
            relationType?: {
                slug: string;
            } | null;
        }>;
    }>;
}
/** Normalize the raw GraphQL catalog payload into flat arrays. */
export declare const normalizePublicCatalog: (data: CatalogGqlData) => PublicCatalog;
export interface FetchPublicCatalogOptions {
    /** GraphQL endpoint. Defaults to the production omni-api. */
    url?: string;
    /** Fetch implementation, for tests or non-global-fetch runtimes. */
    fetch?: typeof globalThis.fetch;
}
/**
 * Fetch and normalize the public catalog from omni-api. Throws on a failed
 * request, a GraphQL error, or an empty payload; callers own their fallback.
 */
export declare const fetchPublicCatalog: (options?: FetchPublicCatalogOptions) => Promise<PublicCatalog>;
export {};
