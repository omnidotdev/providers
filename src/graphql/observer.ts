import { EXPORTABLE } from "graphile-export/helpers";
import { context, lambda } from "postgraphile/grafast";
import { extendSchema, gql } from "postgraphile/utils";

import type { ExecutableStep } from "postgraphile/grafast";

type ObserverField = {
  name: string;
  type: string;
  /** Context key to read from. Defaults to field name */
  contextKey?: string;
};

const BASE_FIELDS: ObserverField[] = [
  { name: "rowId", type: "UUID!" },
  { name: "identityProviderId", type: "UUID!" },
  { name: "name", type: "String!" },
  { name: "email", type: "String!" },
];

/**
 * Create an observer plugin that exposes the current authenticated user.
 * @param config - Optional config to add extra fields to the Observer type
 */
const createObserverPlugin = (config?: {
  extraFields?: ObserverField[];
}): GraphileConfig.Plugin => {
  const allFields = [...BASE_FIELDS, ...(config?.extraFields ?? [])];

  const fieldDefs = allFields
    .map((f) => `      ${f.name}: ${f.type}`)
    .join("\n");

  return extendSchema({
    typeDefs: gql`
    """
    The currently authenticated user.
    """
    type Observer {
${fieldDefs}
    }

    extend type Query {
      """
      Returns the currently authenticated user (observer).
      Returns null if not authenticated.
      """
      observer: Observer
    }
  `,
    plans: {
      Query: {
        observer: EXPORTABLE(
          (context, lambda, allFields) =>
            function observer() {
              // Context key "observer" is set by the authentication
              // plugin; the Grafast.Context type doesn't know about
              // it, so we cast to access it
              const $observer = (
                context() as { get: (k: string) => ExecutableStep }
              ).get("observer");
              return lambda(
                $observer as ExecutableStep<Record<string, unknown> | null>,
                (observer: Record<string, unknown> | null) => {
                  if (!observer) return null;
                  const result: Record<string, unknown> = {};
                  for (const field of allFields) {
                    const key = field.contextKey ?? field.name;
                    // Map `id` to `rowId` (Drizzle uses `id`,
                    // PostGraphile exposes as `rowId`)
                    if (key === "rowId") {
                      result[key] = observer.id;
                    } else {
                      result[key] = observer[key];
                    }
                  }
                  return result;
                },
              );
            },
          [context, lambda, allFields],
        ),
      },
    },
  });
};

export { createObserverPlugin };

export type { ObserverField };
