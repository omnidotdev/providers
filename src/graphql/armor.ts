import { EnvelopArmor } from "@escape.tech/graphql-armor";

type ArmorConfig = {
  maxCost: number;
  blockFieldSuggestions?: boolean;
  maxDepth?: number;
  objectCost?: number;
  scalarCost?: number;
  depthCostFactor?: number;
  ignoreIntrospection?: boolean;
};

/**
 * Create GraphQL Armor security plugins with the given config.
 * @param config - Armor configuration
 * @returns Array of Envelop plugins
 * @see https://github.com/escape-technologies/graphql-armor
 */
const createArmorPlugins = (config: ArmorConfig) => {
  const armor = new EnvelopArmor({
    blockFieldSuggestion: {
      enabled: config.blockFieldSuggestions ?? false,
    },
    maxDepth: {
      enabled: true,
      n: config.maxDepth ?? 10,
    },
    costLimit: {
      enabled: true,
      maxCost: config.maxCost,
      objectCost: config.objectCost ?? 2,
      scalarCost: config.scalarCost ?? 1,
      depthCostFactor: config.depthCostFactor ?? 1.5,
      ignoreIntrospection: config.ignoreIntrospection ?? true,
    },
  });

  return armor.protect().plugins;
};

export { createArmorPlugins };

export type { ArmorConfig };
