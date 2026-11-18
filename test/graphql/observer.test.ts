import { describe, expect, it } from "bun:test";

import { printSchema } from "graphql";
import { makeSchema } from "postgraphile";
import { PostGraphileAmberPreset } from "postgraphile/presets/amber";

import { createObserverPlugin } from "../../src/graphql/observer";

/** The printed Observer type a plugin config produces */
const observerType = async (
  config?: Parameters<typeof createObserverPlugin>[0],
) => {
  const { schema } = await makeSchema({
    extends: [PostGraphileAmberPreset],
    plugins: [createObserverPlugin(config)],
    pgServices: [],
  });
  const printed = printSchema(schema);
  const start = printed.indexOf("type Observer {");
  return printed.slice(start, printed.indexOf("}", start) + 1);
};

describe("createObserverPlugin", () => {
  it("types identityProviderId as UUID! by default", async () => {
    expect(await observerType()).toContain("identityProviderId: UUID!");
  });

  it("types identityProviderId as String! for providers whose subjects are not UUIDs", async () => {
    const type = await observerType({ identityProviderIdType: "String!" });
    expect(type).toContain("identityProviderId: String!");
    expect(type).toContain("rowId: UUID!");
  });

  it("keeps extra fields", async () => {
    const type = await observerType({
      identityProviderIdType: "String!",
      extraFields: [{ name: "handle", type: "String" }],
    });
    expect(type).toContain("handle: String");
  });
});
