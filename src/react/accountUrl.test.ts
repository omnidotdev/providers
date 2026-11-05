import { describe, expect, it } from "bun:test";

import { accountUrl, workspacesUrl } from "./accountUrl";

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

  it("returns an empty string when no base is configured", () => {
    expect(accountUrl(undefined)).toBe("");
  });
});

describe("workspacesUrl", () => {
  it("points at the account hub workspaces console", () => {
    expect(workspacesUrl("https://account.omni.dev")).toBe(
      "https://account.omni.dev/workspaces",
    );
  });

  it("trims a trailing slash on the base URL", () => {
    expect(workspacesUrl("https://account.omni.dev/")).toBe(
      "https://account.omni.dev/workspaces",
    );
  });

  it("returns an empty string when no base is configured", () => {
    expect(workspacesUrl(undefined)).toBe("");
  });
});
