import type { GraphQLSchema } from "graphql";
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
export type SchemaSurfacePolicy = Partial<Record<RootTypeName, Record<string, string>>>;
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
/**
 * Build a schema from SDL text or a path to a `.graphql` file (e.g. the
 * committed `src/generated/graphql/schema.graphql`).
 */
export declare const loadSchema: (sdlOrPath: string) => GraphQLSchema;
/**
 * List every root field the schema exposes, grouped by root type. Use it to
 * bootstrap a policy, then write the authorization rule for each entry by hand.
 */
export declare const listRootFields: (schema: GraphQLSchema) => Record<RootTypeName, string[]>;
/**
 * Compare the schema's root fields against the reviewed policy.
 *
 * Returns every field that is exposed but unreviewed, listed but gone (so the
 * policy stays an accurate record), or listed without a rule. An empty array
 * means the surface matches the review exactly.
 */
export declare const auditSchemaSurface: (schema: GraphQLSchema, policy: SchemaSurfacePolicy, options?: SchemaSurfaceOptions) => SchemaSurfaceViolation[];
/**
 * Render violations as a readable failure message.
 */
export declare const formatSchemaSurfaceViolations: (violations: SchemaSurfaceViolation[]) => string;
/**
 * Throw unless the schema's root fields match the reviewed policy exactly.
 * Call it from a test so CI fails on any unreviewed field.
 */
export declare const assertSchemaSurface: (schema: GraphQLSchema, policy: SchemaSurfacePolicy, options?: SchemaSurfaceOptions) => void;
/**
 * Find Postgraphile-generated create/update/delete mutations by shape.
 *
 * Generated CRUD payloads carry a `<table>Edge` field; custom
 * `makeExtendSchemaPlugin` mutations usually do not. Shape detection catches a
 * newly added table that nobody locked down, without a name list. Pair it with
 * `defaultBehavior: "-insert -update -delete"` to assert a fail-closed preset.
 */
export declare const findGeneratedCrudMutations: (schema: GraphQLSchema) => string[];
/**
 * Find table-backed reads on `Query`: connections (with a generated
 * `condition` argument) and single-row lookups whose type has a generated
 * `<Type>Condition` input. Each needs a scoping rule, or it reads every
 * tenant's rows.
 */
export declare const findTableReadFields: (schema: GraphQLSchema) => string[];
export {};
