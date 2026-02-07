// src/graphql/armor.ts
import { EnvelopArmor } from "@escape.tech/graphql-armor";
var createArmorPlugins = (config) => {
  const armor = new EnvelopArmor({
    blockFieldSuggestion: {
      enabled: config.blockFieldSuggestions ?? false
    },
    maxDepth: {
      enabled: true,
      n: config.maxDepth ?? 10
    },
    costLimit: {
      enabled: true,
      maxCost: config.maxCost,
      objectCost: config.objectCost ?? 2,
      scalarCost: config.scalarCost ?? 1,
      depthCostFactor: config.depthCostFactor ?? 1.5,
      ignoreIntrospection: config.ignoreIntrospection ?? true
    }
  });
  return armor.protect().plugins;
};
// src/graphql/authentication.ts
import { QueryClient } from "@tanstack/query-core";

// src/auth/types.ts
var OMNI_CLAIMS_NAMESPACE = "https://manifold.omni.dev/@omni/claims/organizations";

// src/graphql/authentication.ts
class AuthenticationError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}
var validateClaims = (claims, config) => {
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp !== undefined && claims.exp < now) {
    throw new AuthenticationError("Token has expired", "TOKEN_EXPIRED");
  }
  if (claims.iat !== undefined && claims.iat > now + 60) {
    throw new AuthenticationError("Token issued in the future", "INVALID_TOKEN_IAT");
  }
  const issuer = config?.expectedIssuer;
  if (issuer && claims.iss !== undefined && claims.iss !== issuer) {
    throw new AuthenticationError("Token issuer mismatch", "INVALID_TOKEN_ISSUER");
  }
};
var isIntrospectionQuery = (query) => {
  if (!query)
    return false;
  return query.includes("__schema") || query.includes("IntrospectionQuery");
};
var extractBearerToken = (header) => {
  return header?.split("Bearer ")[1];
};
var createAuthQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 120000
      }
    }
  });
};
var createGetOrganizationClaimsFromCache = (queryClient) => {
  return (accessToken) => {
    const cached = queryClient.getQueryData([
      "UserInfo",
      { accessToken }
    ]);
    return cached?.[OMNI_CLAIMS_NAMESPACE] ?? [];
  };
};
// src/graphql/observer.ts
import { EXPORTABLE } from "graphile-export/helpers";
import { context, lambda } from "postgraphile/grafast";
import { extendSchema, gql } from "postgraphile/utils";
var BASE_FIELDS = [
  { name: "rowId", type: "UUID!" },
  { name: "identityProviderId", type: "UUID!" },
  { name: "name", type: "String!" },
  { name: "email", type: "String!" }
];
var createObserverPlugin = (config) => {
  const allFields = [...BASE_FIELDS, ...config?.extraFields ?? []];
  const fieldDefs = allFields.map((f) => `      ${f.name}: ${f.type}`).join(`
`);
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
        observer: EXPORTABLE((context2, lambda2, allFields2) => function observer() {
          const $observer = context2().get("observer");
          return lambda2($observer, (observer) => {
            if (!observer)
              return null;
            const result = {};
            for (const field of allFields2) {
              const key = field.contextKey ?? field.name;
              if (key === "rowId") {
                result[key] = observer.id;
              } else {
                result[key] = observer[key];
              }
            }
            return result;
          });
        }, [context, lambda, allFields])
      }
    }
  });
};
// src/graphql/organizations.ts
var createOrganizationsPlugin = (config) => {
  return {
    onContextBuilding({ extendContext, context: context2 }) {
      const accessToken = context2.request.headers.get("authorization")?.split("Bearer ")[1];
      if (!accessToken) {
        extendContext({
          organizations: []
        });
        return;
      }
      const organizations = config.getOrganizationClaimsFromCache(accessToken);
      extendContext({ organizations });
    }
  };
};
// src/graphql/primaryKeyMutationsOnly.ts
var PrimaryKeyMutationsOnlyPlugin = {
  name: "PrimaryKeyMutationsOnlyPlugin",
  version: "0.0.0",
  gather: {
    hooks: {
      pgIntrospection_introspection(_info, event) {
        const { introspection } = event;
        for (const pgConstraint of introspection.constraints) {
          if (pgConstraint.contype === "u") {
            const tags = pgConstraint.getTags();
            const newBehavior = ["-update", "-delete"];
            if (typeof tags.behavior === "string") {
              newBehavior.push(tags.behavior);
            } else if (Array.isArray(tags.behavior)) {
              newBehavior.push(...tags.behavior);
            }
            tags.behavior = newBehavior;
          }
        }
      }
    }
  }
};
export {
  validateClaims,
  isIntrospectionQuery,
  extractBearerToken,
  createOrganizationsPlugin,
  createObserverPlugin,
  createGetOrganizationClaimsFromCache,
  createAuthQueryClient,
  createArmorPlugins,
  PrimaryKeyMutationsOnlyPlugin,
  AuthenticationError
};
