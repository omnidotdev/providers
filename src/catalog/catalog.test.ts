import { describe, expect, mock, test } from "bun:test";

import { fetchPublicCatalog, normalizePublicCatalog } from "./index";

const sampleData = {
  realms: {
    nodes: [
      { slug: "core", name: "Core", icon: "🧱", tagline: "Foundation" },
      { slug: "empty", name: "Empty", icon: "🫙" },
    ],
  },
  products: {
    nodes: [
      {
        slug: "runa",
        name: "Runa",
        realm: { slug: "core" },
        releaseDate: "2025-12-21",
        status: "active",
        productDeploymentMethods: {
          nodes: [{ deploymentMethod: { slug: "docker-compose" } }],
        },
      },
      {
        slug: "orin",
        name: "Orin",
        realm: null,
        status: "coming_soon",
        productDeploymentMethods: { nodes: [] },
      },
    ],
  },
  bundles: {
    nodes: [
      {
        slug: "omni-creator",
        name: "Creator",
        appGrants: { runa: "pro" },
        monthlyPrice: 1900,
        yearlyPrice: 18000,
        monthlyCreditAllowance: "15.0000",
      },
    ],
  },
  productLinks: {
    nodes: [
      {
        slug: "runa-orin",
        sourceProduct: { slug: "runa" },
        targetProduct: { slug: "orin" },
        status: "planned",
        productLinkRelations: {
          nodes: [{ relationType: { slug: "integrates-with" } }],
        },
      },
    ],
  },
};

describe("normalizePublicCatalog", () => {
  const catalog = normalizePublicCatalog(sampleData);

  test("maps products with realm slug and flattened deployment methods", () => {
    const runa = catalog.products.find((p) => p.id === "runa");
    expect(runa?.realm).toBe("core");
    expect(runa?.deploymentMethods).toEqual(["docker-compose"]);
    const orin = catalog.products.find((p) => p.id === "orin");
    expect(orin?.realm).toBeNull();
    expect(orin?.status).toBe("coming_soon");
  });

  test("drops realms with no product", () => {
    expect(catalog.realms.map((r) => r.slug)).toEqual(["core"]);
  });

  test("coerces bundle credit allowance to a number", () => {
    expect(catalog.bundles[0]?.monthlyCreditAllowance).toBe(15);
  });

  test("flattens product links into single-pair connections", () => {
    expect(catalog.connections).toHaveLength(1);
    expect(catalog.connections[0]).toMatchObject({
      id: "runa-orin",
      source: "runa",
      target: "orin",
      relations: ["integrates-with"],
    });
  });
});

describe("fetchPublicCatalog", () => {
  const okResponse = (data: unknown) =>
    ({
      ok: true,
      status: 200,
      json: async () => ({ data }),
    }) as Response;

  test("returns the normalized catalog on success", async () => {
    const fetch = mock(async () => okResponse(sampleData));
    const catalog = await fetchPublicCatalog({
      url: "https://example.test/graphql",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(catalog.products).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("throws on a non-ok response", async () => {
    const fetch = mock(async () => ({ ok: false, status: 503 }) as Response);
    expect(
      fetchPublicCatalog({
        fetch: fetch as unknown as typeof globalThis.fetch,
      }),
    ).rejects.toThrow("503");
  });

  test("throws on a GraphQL error payload", async () => {
    const fetch = mock(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({ errors: [{ message: "boom" }] }),
        }) as Response,
    );
    expect(
      fetchPublicCatalog({
        fetch: fetch as unknown as typeof globalThis.fetch,
      }),
    ).rejects.toThrow("no usable catalog");
  });
});
