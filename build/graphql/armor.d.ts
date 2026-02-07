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
declare const createArmorPlugins: (config: ArmorConfig) => import("@envelop/types").Plugin<{}>[];
export { createArmorPlugins };
export type { ArmorConfig };
