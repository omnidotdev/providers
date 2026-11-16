import { readFileSync } from "node:fs";

import { GraphQLObjectType, buildSchema, getNamedType } from "graphql";

import type { GraphQLField, GraphQLSchema } from "graphql";

/**
 * Root operation types whose fields form an API's callable surface.
 */
type RootTypeName = "Query" | "Mutation" | "Subscription";

/**
 * Reviewed GraphQL surface for one API.
 *
 * Every root field the schema exposes must appear here with the rule that
 * authorizes it (e.g. "org member, scoped by TenantScopePlugin",
 * "public: published catalog only", "admin only via wrapPlans"). A field that
 * is not listed fails the guard, so a newly generated table, column or custom
 * mutation cannot ship until someone reviews how it is authorized.
 */
export type SchemaSurfacePolicy = Partial<
  Record<RootTypeName, Record<string, string>>
>;

export type SchemaSurfaceViolation = {
  /**
   * `unreviewed`: exposed by the schema but missing from the policy.
   * `stale`: listed in the policy but no longer in the schema.
   * `missing-rule`: listed with an empty authorization rule.
   */
  kind: "unreviewed" | "stale" | "missing-rule";
  root: RootTypeName;
  field: string;
};

export type SchemaSurfaceOptions = {
  /**
   * Root fields that carry no data and need no rule. Defaults to the Relay
   * plumbing Postgraphile adds to `Query` (`query` returns the root type
   * itself, `nodeId` is a constant). `node(id)` is NOT exempt: it reads any row
   * by global id
   */
  exempt?: Partial<Record<RootTypeName, string[]>>;
};

const ROOTS: RootTypeName[] = ["Query", "Mutation", "Subscription"];

const DEFAULT_EXEMPT: Partial<Record<RootTypeName, string[]>> = {
  Query: ["query", "nodeId"],
};

const rootFields = (
  schema: GraphQLSchema,
  root: RootTypeName,
): Record<string, GraphQLField<unknown, unknown>> => {
  const type =
    root === "Query"
      ? schema.getQueryType()
      : root === "Mutation"
        ? schema.getMutationType()
        : schema.getSubscriptionType();

  return type?.getFields() ?? {};
};

/**
 * Build a schema from SDL text or a path to a `.graphql` file (e.g. the
 * committed `src/generated/graphql/schema.graphql`).
 */
export const loadSchema = (sdlOrPath: string): GraphQLSchema => {
  const sdl = sdlOrPath.trimEnd().endsWith(".graphql")
    ? readFileSync(sdlOrPath, "utf-8")
    : sdlOrPath;

  return buildSchema(sdl);
};

/**
 * List every root field the schema exposes, grouped by root type. Use it to
 * bootstrap a policy, then write the authorization rule for each entry by hand.
 */
export const listRootFields = (
  schema: GraphQLSchema,
): Record<RootTypeName, string[]> => ({
  Query: Object.keys(rootFields(schema, "Query")).sort(),
  Mutation: Object.keys(rootFields(schema, "Mutation")).sort(),
  Subscription: Object.keys(rootFields(schema, "Subscription")).sort(),
});

/**
 * Compare the schema's root fields against the reviewed policy.
 *
 * Returns every field that is exposed but unreviewed, listed but gone (so the
 * policy stays an accurate record), or listed without a rule. An empty array
 * means the surface matches the review exactly.
 */
export const auditSchemaSurface = (
  schema: GraphQLSchema,
  policy: SchemaSurfacePolicy,
  options: SchemaSurfaceOptions = {},
): SchemaSurfaceViolation[] => {
  const exempt = options.exempt ?? DEFAULT_EXEMPT;
  const violations: SchemaSurfaceViolation[] = [];

  for (const root of ROOTS) {
    const exposed = Object.keys(rootFields(schema, root));
    const reviewed = policy[root] ?? {};
    const skip = new Set(exempt[root] ?? []);

    for (const field of exposed) {
      if (skip.has(field)) continue;

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

/**
 * Render violations as a readable failure message.
 */
export const formatSchemaSurfaceViolations = (
  violations: SchemaSurfaceViolation[],
): string => {
  const lines = violations.map(({ kind, root, field }) => {
    if (kind === "unreviewed")
      return `  + ${root}.${field}: exposed but not reviewed (add it to the policy with its authorization rule, or hide it)`;
    if (kind === "stale")
      return `  - ${root}.${field}: in the policy but no longer exposed (remove it)`;

    return `  ! ${root}.${field}: listed without an authorization rule`;
  });

  return `GraphQL surface does not match the reviewed policy:\n${lines.join("\n")}`;
};

/**
 * Throw unless the schema's root fields match the reviewed policy exactly.
 * Call it from a test so CI fails on any unreviewed field.
 */
export const assertSchemaSurface = (
  schema: GraphQLSchema,
  policy: SchemaSurfacePolicy,
  options?: SchemaSurfaceOptions,
): void => {
  const violations = auditSchemaSurface(schema, policy, options);

  if (violations.length)
    throw new Error(formatSchemaSurfaceViolations(violations));
};

/**
 * Find Postgraphile-generated create/update/delete mutations by shape.
 *
 * Generated CRUD payloads carry a `<table>Edge` field; custom
 * `makeExtendSchemaPlugin` mutations usually do not. Shape detection catches a
 * newly added table that nobody locked down, without a name list. Pair it with
 * `defaultBehavior: "-insert -update -delete"` to assert a fail-closed preset.
 */
export const findGeneratedCrudMutations = (schema: GraphQLSchema): string[] =>
  Object.values(rootFields(schema, "Mutation"))
    .filter((field) => {
      const payload = getNamedType(field.type);

      return (
        payload instanceof GraphQLObjectType &&
        Object.keys(payload.getFields()).some((name) => name.endsWith("Edge"))
      );
    })
    .map((field) => field.name)
    .sort();

/**
 * Find table-backed reads on `Query`: connections (with a generated
 * `condition` argument) and single-row lookups whose type has a generated
 * `<Type>Condition` input. Each needs a scoping rule, or it reads every
 * tenant's rows.
 */
export const findTableReadFields = (schema: GraphQLSchema): string[] =>
  Object.values(rootFields(schema, "Query"))
    .filter((field) => {
      const name = getNamedType(field.type).name;

      return (
        (name.endsWith("Connection") &&
          field.args.some((arg) => arg.name === "condition")) ||
        schema.getType(`${name}Condition`) !== undefined
      );
    })
    .map((field) => field.name)
    .sort();
