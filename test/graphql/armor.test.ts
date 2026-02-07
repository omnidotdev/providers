import { describe, expect, it } from "bun:test";

import { createArmorPlugins } from "../../src/graphql/armor";

describe("createArmorPlugins", () => {
  it("returns an array of plugins", () => {
    const plugins = createArmorPlugins({ maxCost: 5000 });
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it("accepts full config", () => {
    const plugins = createArmorPlugins({
      maxCost: 10000,
      blockFieldSuggestions: true,
      maxDepth: 15,
      objectCost: 3,
      scalarCost: 2,
      depthCostFactor: 2.0,
      ignoreIntrospection: false,
    });
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it("uses defaults for optional config", () => {
    // Should not throw with minimal config
    const plugins = createArmorPlugins({ maxCost: 1000 });
    expect(plugins.length).toBeGreaterThan(0);
  });
});
