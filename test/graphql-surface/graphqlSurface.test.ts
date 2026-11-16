import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertSchemaSurface,
  auditSchemaSurface,
  findGeneratedCrudMutations,
  findTableReadFields,
  listRootFields,
  loadSchema,
} from "../../src/graphql-surface";

const SDL = `
type Query {
  query: Query!
  nodeId: ID!
  node(id: ID!): Node
  widgets(condition: WidgetCondition): WidgetsConnection
  widget(rowId: UUID!): Widget
  viewer: String
}

interface Node { id: ID! }
scalar UUID

type Widget { rowId: UUID! }
input WidgetCondition { rowId: UUID }
type WidgetsConnection { nodes: [Widget]! }
type WidgetsEdge { node: Widget }

type Mutation {
  createWidget(input: CreateWidgetInput!): CreateWidgetPayload
  shareWidget(rowId: UUID!): Boolean
}

input CreateWidgetInput { rowId: UUID }
type CreateWidgetPayload { widget: Widget, widgetEdge: WidgetsEdge }
`;

const schema = loadSchema(SDL);

const policy = {
  Query: {
    node: "disabled in prod via NodePlugin; listed for the fixture",
    widgets: "scoped to the caller's org by TenantScopePlugin",
    widget: "scoped to the caller's org by TenantScopePlugin",
    viewer: "public: returns the caller's own identity",
  },
  Mutation: {
    createWidget: "org admin via wrapPlans",
    shareWidget: "widget owner via makeExtendSchemaPlugin plan",
  },
};

describe("auditSchemaSurface", () => {
  test("passes when every root field is reviewed", () => {
    expect(auditSchemaSurface(schema, policy)).toEqual([]);
    expect(() => assertSchemaSurface(schema, policy)).not.toThrow();
  });

  test("flags a newly exposed field that nobody reviewed", () => {
    const { shareWidget: _, ...mutation } = policy.Mutation;

    expect(
      auditSchemaSurface(schema, { ...policy, Mutation: mutation }),
    ).toEqual([{ kind: "unreviewed", root: "Mutation", field: "shareWidget" }]);
    expect(() =>
      assertSchemaSurface(schema, { ...policy, Mutation: mutation }),
    ).toThrow(/Mutation\.shareWidget: exposed but not reviewed/);
  });

  test("flags a policy entry for a field that is gone", () => {
    expect(
      auditSchemaSurface(schema, {
        ...policy,
        Mutation: { ...policy.Mutation, deleteWidget: "org admin" },
      }),
    ).toEqual([{ kind: "stale", root: "Mutation", field: "deleteWidget" }]);
  });

  test("flags an entry with an empty authorization rule", () => {
    expect(
      auditSchemaSurface(schema, {
        ...policy,
        Query: { ...policy.Query, viewer: "  " },
      }),
    ).toEqual([{ kind: "missing-rule", root: "Query", field: "viewer" }]);
  });

  test("does not exempt node(id) by default", () => {
    const { node: _, ...query } = policy.Query;

    expect(auditSchemaSurface(schema, { ...policy, Query: query })).toEqual([
      { kind: "unreviewed", root: "Query", field: "node" },
    ]);
  });

  test("honors a custom exemption list", () => {
    expect(
      auditSchemaSurface(
        schema,
        { Query: {}, Mutation: policy.Mutation },
        {
          exempt: {
            Query: ["query", "nodeId", "node", "widgets", "widget", "viewer"],
          },
        },
      ),
    ).toEqual([]);
  });
});

describe("schema shape helpers", () => {
  test("finds generated CRUD mutations by their Edge payload", () => {
    expect(findGeneratedCrudMutations(schema)).toEqual(["createWidget"]);
  });

  test("finds table-backed reads on Query", () => {
    expect(findTableReadFields(schema)).toEqual(["widget", "widgets"]);
  });

  test("lists root fields for bootstrapping a policy", () => {
    expect(listRootFields(schema)).toEqual({
      Query: ["node", "nodeId", "query", "viewer", "widget", "widgets"],
      Mutation: ["createWidget", "shareWidget"],
      Subscription: [],
    });
  });

  test("loads a schema from a .graphql file path", () => {
    const path = join(
      mkdtempSync(join(tmpdir(), "surface-")),
      "schema.graphql",
    );
    writeFileSync(path, SDL);

    expect(listRootFields(loadSchema(path)).Mutation).toEqual([
      "createWidget",
      "shareWidget",
    ]);
  });
});
