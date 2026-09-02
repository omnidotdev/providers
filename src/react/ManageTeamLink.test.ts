import { describe, expect, it } from "bun:test";

import { accountUrl, gatekeeperOrgManageUrl } from "./ManageTeamLink";

describe("gatekeeperOrgManageUrl", () => {
  it("points at the account hub organizations route", () => {
    expect(gatekeeperOrgManageUrl("https://account.omni.dev", "acme")).toBe(
      "https://account.omni.dev/organizations/acme",
    );
  });

  it("trims a trailing slash on the base URL", () => {
    expect(gatekeeperOrgManageUrl("https://account.omni.dev/", "acme")).toBe(
      "https://account.omni.dev/organizations/acme",
    );
  });
});

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
