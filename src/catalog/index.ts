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

const DEFAULT_GRAPHQL_URL = "https://api.omni.dev/graphql";

/** The public catalog surface. `products` is `is_public`-filtered server-side. */
export const PUBLIC_CATALOG_QUERY = `{
  realms(first: 100) { nodes { slug name icon tagline description } }
  products(first: 200) {
    nodes {
      slug name icon description tagline websiteUrl docsUrl license
      selfHostable releaseDate status realm { slug }
      productDeploymentMethods { nodes { deploymentMethod { slug } } }
    }
  }
  bundles(first: 50) {
    nodes {
      slug name description appGrants monthlyPrice yearlyPrice
      monthlyCreditAllowance
    }
  }
  productLinks(first: 1000) {
    nodes {
      slug sourceProduct { slug } targetProduct { slug } description status
      productLinkRelations { nodes { relationType { slug } } }
    }
  }
}`;

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

type Nodes<T> = { nodes: T[] };
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
    realm?: { slug: string } | null;
    productDeploymentMethods: Nodes<{
      deploymentMethod?: { slug: string } | null;
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
    sourceProduct?: { slug: string } | null;
    targetProduct?: { slug: string } | null;
    description?: string | null;
    status?: string | null;
    productLinkRelations: Nodes<{ relationType?: { slug: string } | null }>;
  }>;
}

const filterSlugs = (values: (string | undefined | null)[]): string[] =>
  values.filter((s): s is string => Boolean(s));

/** Normalize the raw GraphQL catalog payload into flat arrays. */
export const normalizePublicCatalog = (data: CatalogGqlData): PublicCatalog => {
  const products: PublicProduct[] = data.products.nodes.map((p) => ({
    id: p.slug,
    name: p.name,
    icon: p.icon ?? undefined,
    realm: p.realm?.slug ?? null,
    description: p.description ?? undefined,
    tagline: p.tagline ?? undefined,
    websiteUrl: p.websiteUrl ?? undefined,
    docsUrl: p.docsUrl ?? undefined,
    license: p.license ?? undefined,
    selfHostable: p.selfHostable ?? undefined,
    releaseDate: p.releaseDate ?? undefined,
    status: p.status ?? undefined,
    deploymentMethods: filterSlugs(
      p.productDeploymentMethods.nodes.map((m) => m.deploymentMethod?.slug),
    ),
  }));

  const productRealms = new Set(
    products.map((p) => p.realm).filter((r): r is string => Boolean(r)),
  );

  // Drop realms with no product so surfaces never render an empty branch.
  const realms: PublicRealm[] = data.realms.nodes
    .filter((r) => productRealms.has(r.slug))
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      icon: r.icon ?? undefined,
      tagline: r.tagline ?? undefined,
      description: r.description ?? undefined,
    }));

  const bundles: PublicBundle[] = data.bundles.nodes.map((b) => ({
    slug: b.slug,
    name: b.name,
    description: b.description ?? undefined,
    appGrants: b.appGrants,
    monthlyPrice: b.monthlyPrice,
    yearlyPrice: b.yearlyPrice,
    monthlyCreditAllowance: Number(b.monthlyCreditAllowance ?? 0),
  }));

  const connections: PublicConnection[] = data.productLinks.nodes
    .filter((l) => l.sourceProduct && l.targetProduct)
    .map((l) => ({
      id: l.slug,
      source: (l.sourceProduct as { slug: string }).slug,
      target: (l.targetProduct as { slug: string }).slug,
      // Sorted so regenerated snapshots are deterministic regardless of the
      // order the API returns relation rows.
      relations: filterSlugs(
        l.productLinkRelations.nodes.map((r) => r.relationType?.slug),
      ).sort(),
      description: l.description ?? undefined,
      status: l.status ?? undefined,
    }));

  return { realms, products, bundles, connections };
};

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
export const fetchPublicCatalog = async (
  options: FetchPublicCatalogOptions = {},
): Promise<PublicCatalog> => {
  const { url = DEFAULT_GRAPHQL_URL, fetch = globalThis.fetch } = options;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: PUBLIC_CATALOG_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`omni-api ${url} returned ${res.status}`);
  }

  const payload = (await res.json()) as {
    errors?: unknown;
    data?: CatalogGqlData;
  };

  if (payload.errors || !payload.data) {
    throw new Error("omni-api returned no usable catalog");
  }

  return normalizePublicCatalog(payload.data);
};
