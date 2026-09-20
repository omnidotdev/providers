import { describe, expect, it } from "bun:test";

import { createArborConnection } from "./arborConnection";

describe("arbor connection", () => {
  const conn = createArborConnection({ appUrl: "https://arbor.omni.dev" });

  it("builds a repo link-out url", () => {
    expect(conn.linkOut("ada", "lace")).toBe(
      "https://arbor.omni.dev/@ada/lace",
    );
  });

  it("tolerates a leading @ on the owner handle", () => {
    expect(conn.linkOut("@ada", "lace")).toBe(
      "https://arbor.omni.dev/@ada/lace",
    );
  });
});
