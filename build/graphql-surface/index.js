var __require = typeof require !== "undefined" ? require : (await import("node:module")).createRequire(import.meta.url);
// src/graphql-surface/index.ts
var { readFileSync } = __require("node:fs");
import { GraphQLObjectType, buildSchema, getNamedType } from "graphql";
var ROOTS = ["Query", "Mutation", "Subscription"];
var DEFAULT_EXEMPT = {
  Query: ["query", "nodeId"]
};
var rootFields = (schema, root) => {
  const type = root === "Query" ? schema.getQueryType() : root === "Mutation" ? schema.getMutationType() : schema.getSubscriptionType();
  return type?.getFields() ?? {};
};
var loadSchema = (sdlOrPath) => {
  const sdl = sdlOrPath.trimEnd().endsWith(".graphql") ? readFileSync(sdlOrPath, "utf-8") : sdlOrPath;
  return buildSchema(sdl);
};
var listRootFields = (schema) => ({
  Query: Object.keys(rootFields(schema, "Query")).sort(),
  Mutation: Object.keys(rootFields(schema, "Mutation")).sort(),
  Subscription: Object.keys(rootFields(schema, "Subscription")).sort()
});
var auditSchemaSurface = (schema, policy, options = {}) => {
  const exempt = options.exempt ?? DEFAULT_EXEMPT;
  const violations = [];
  for (const root of ROOTS) {
    const exposed = Object.keys(rootFields(schema, root));
    const reviewed = policy[root] ?? {};
    const skip = new Set(exempt[root] ?? []);
    for (const field of exposed) {
      if (skip.has(field))
        continue;
      const rule = reviewed[field];
      if (rule === undefined)
        violations.push({ kind: "unreviewed", root, field });
      else if (!rule.trim())
        violations.push({ kind: "missing-rule", root, field });
    }
    for (const field of Object.keys(reviewed)) {
      if (!exposed.includes(field))
        violations.push({ kind: "stale", root, field });
    }
  }
  return violations;
};
var formatSchemaSurfaceViolations = (violations) => {
  const lines = violations.map(({ kind, root, field }) => {
    if (kind === "unreviewed")
      return `  + ${root}.${field}: exposed but not reviewed (add it to the policy with its authorization rule, or hide it)`;
    if (kind === "stale")
      return `  - ${root}.${field}: in the policy but no longer exposed (remove it)`;
    return `  ! ${root}.${field}: listed without an authorization rule`;
  });
  return `GraphQL surface does not match the reviewed policy:
${lines.join(`
`)}`;
};
var assertSchemaSurface = (schema, policy, options) => {
  const violations = auditSchemaSurface(schema, policy, options);
  if (violations.length)
    throw new Error(formatSchemaSurfaceViolations(violations));
};
var findGeneratedCrudMutations = (schema) => Object.values(rootFields(schema, "Mutation")).filter((field) => {
  const payload = getNamedType(field.type);
  return payload instanceof GraphQLObjectType && Object.keys(payload.getFields()).some((name) => name.endsWith("Edge"));
}).map((field) => field.name).sort();
var findTableReadFields = (schema) => Object.values(rootFields(schema, "Query")).filter((field) => {
  const name = getNamedType(field.type).name;
  return name.endsWith("Connection") && field.args.some((arg) => arg.name === "condition") || schema.getType(`${name}Condition`) !== undefined;
}).map((field) => field.name).sort();
export {
  assertSchemaSurface,
  auditSchemaSurface,
  findGeneratedCrudMutations,
  findTableReadFields,
  formatSchemaSurfaceViolations,
  listRootFields,
  loadSchema
};
