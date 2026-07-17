// src/catalog/index.ts
var DEFAULT_GRAPHQL_URL = "https://api.omni.dev/graphql";
var PUBLIC_CATALOG_QUERY = `{
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
var filterSlugs = (values) => values.filter((s) => Boolean(s));
var normalizePublicCatalog = (data) => {
  const products = data.products.nodes.map((p) => ({
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
    deploymentMethods: filterSlugs(p.productDeploymentMethods.nodes.map((m) => m.deploymentMethod?.slug))
  }));
  const productRealms = new Set(products.map((p) => p.realm).filter((r) => Boolean(r)));
  const realms = data.realms.nodes.filter((r) => productRealms.has(r.slug)).map((r) => ({
    slug: r.slug,
    name: r.name,
    icon: r.icon ?? undefined,
    tagline: r.tagline ?? undefined,
    description: r.description ?? undefined
  }));
  const bundles = data.bundles.nodes.map((b) => ({
    slug: b.slug,
    name: b.name,
    description: b.description ?? undefined,
    appGrants: b.appGrants,
    monthlyPrice: b.monthlyPrice,
    yearlyPrice: b.yearlyPrice,
    monthlyCreditAllowance: Number(b.monthlyCreditAllowance ?? 0)
  }));
  const connections = data.productLinks.nodes.filter((l) => l.sourceProduct && l.targetProduct).map((l) => ({
    id: l.slug,
    source: l.sourceProduct.slug,
    target: l.targetProduct.slug,
    relations: filterSlugs(l.productLinkRelations.nodes.map((r) => r.relationType?.slug)).sort(),
    description: l.description ?? undefined,
    status: l.status ?? undefined
  }));
  return { realms, products, bundles, connections };
};
var fetchPublicCatalog = async (options = {}) => {
  const { url = DEFAULT_GRAPHQL_URL, fetch = globalThis.fetch } = options;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: PUBLIC_CATALOG_QUERY })
  });
  if (!res.ok) {
    throw new Error(`omni-api ${url} returned ${res.status}`);
  }
  const payload = await res.json();
  if (payload.errors || !payload.data) {
    throw new Error("omni-api returned no usable catalog");
  }
  return normalizePublicCatalog(payload.data);
};
export {
  normalizePublicCatalog,
  fetchPublicCatalog,
  PUBLIC_CATALOG_QUERY
};
