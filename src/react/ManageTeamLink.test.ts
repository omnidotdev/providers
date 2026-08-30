import { describe, expect, it } from "bun:test";

import { accountUrl } from "./ManageTeamLink";

describe("accountUrl", () => {
  it("returns the base URL unchanged", () => {
    expect(accountUrl("https://account.omni.dev")).toBe(
      "https://account.omni.dev",
    );
  });

  it("trims a trailing slash", () => {
    expect(accountUrl("https://account.omni.dev/")).toBe(
      "https://account.omni.dev",
    );
  });

  it("passes the interim identity dashboard URL through unchanged", () => {
    expect(accountUrl("https://identity.omni.dev/dashboard")).toBe(
      "https://identity.omni.dev/dashboard",
    );
  });
});
