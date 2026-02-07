/**
 * Plugin that restricts mutations to only expose those linked
 * by a primary key. Unique constraints get `-update -delete`
 * behavior tags, preventing mutations from being generated for them.
 */
const PrimaryKeyMutationsOnlyPlugin: GraphileConfig.Plugin = {
  name: "PrimaryKeyMutationsOnlyPlugin",
  version: "0.0.0",
  gather: {
    hooks: {
      pgIntrospection_introspection(
        _info: Record<string, unknown>,
        event: {
          introspection: {
            constraints: Array<{
              contype: string;
              getTags: () => Record<string, unknown>;
            }>;
          };
        },
      ) {
        const { introspection } = event;
        for (const pgConstraint of introspection.constraints) {
          if (pgConstraint.contype === "u") {
            const tags = pgConstraint.getTags();
            const newBehavior = ["-update", "-delete"];
            if (typeof tags.behavior === "string") {
              newBehavior.push(tags.behavior);
            } else if (Array.isArray(tags.behavior)) {
              newBehavior.push(...(tags.behavior as string[]));
            }
            tags.behavior = newBehavior;
          }
        }
      },
    },
  },
};

export { PrimaryKeyMutationsOnlyPlugin };
