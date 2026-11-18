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

/** GraphQL type of `Observer.identityProviderId` */
type IdentityProviderIdType = "UUID!" | "String!";

/** The base Observer fields, in schema order */
const baseFields = (
  identityProviderIdType: IdentityProviderIdType,
): ObserverField[] => [
  { name: "rowId", type: "UUID!" },
  { name: "identityProviderId", type: identityProviderIdType },
  { name: "name", type: "String!" },
  { name: "email", type: "String!" },
];

/**
 * Create an observer plugin that exposes the current authenticated user.
 * Follows the observer pattern convention — see patterns.mdx for details.
 * @param config - Optional config: extra Observer fields, and the type of
 * `identityProviderId`. It defaults to `UUID!` (Gatekeeper subjects); use
 * `String!` for an identity provider whose subjects are arbitrary strings, as
 * any OIDC provider's may be. Changing it changes the API's schema, so a
 * client that declared a `UUID` variable for it must follow
 */
const createObserverPlugin = (config?: {
  extraFields?: ObserverField[];
  identityProviderIdType?: IdentityProviderIdType;
}): GraphileConfig.Plugin => {
  const allFields = [
    ...baseFields(config?.identityProviderIdType ?? "UUID!"),
    ...(config?.extraFields ?? []),
  ];

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

export type { IdentityProviderIdType, ObserverField };
export { createObserverPlugin };
