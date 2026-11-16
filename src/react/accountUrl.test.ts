import { describe, expect, it } from "bun:test";

import {
  accountUrl,
  hubCreditsUrl,
  hubInvoicesUrl,
  hubManageUrl,
  hubPlanUrl,
  workspacesUrl,
} from "./accountUrl";

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

describe("hubPlanUrl", () => {
  it("links to the hub plan purchase with lowercase ids", () => {
    const url = new URL(
      hubPlanUrl("https://account.omni.dev/", {
        product: "Keystone",
        plan: "Pro",
        interval: "month",
        workspace: "Acme",
        returnUrl: "https://keystone.omni.dev/@acme/~/billing",
      }),
    );

    expect(url.origin + url.pathname).toBe("https://account.omni.dev/billing");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      product: "keystone",
      plan: "pro",
      interval: "month",
      workspace: "acme",
      return: "https://keystone.omni.dev/@acme/~/billing",
    });
  });

  it("leaves out an unset workspace and return so the hub asks", () => {
    expect(
      hubPlanUrl("https://account.omni.dev", {
        product: "keystone",
        plan: "team",
        interval: "year",
      }),
    ).toBe(
      "https://account.omni.dev/billing?product=keystone&plan=team&interval=year",
    );
  });

  it("returns an empty string when no base is configured", () => {
    expect(
      hubPlanUrl(undefined, {
        product: "keystone",
        plan: "pro",
        interval: "month",
      }),
    ).toBe("");
  });
});

describe("hubManageUrl", () => {
  it("links to the hub plan management for a workspace", () => {
    expect(
      hubManageUrl("https://account.omni.dev", {
        product: "keystone",
        workspace: "acme",
        returnUrl: "https://keystone.omni.dev/@acme/~/billing",
      }),
    ).toBe(
      "https://account.omni.dev/billing?product=keystone&workspace=acme&manage=1&return=https%3A%2F%2Fkeystone.omni.dev%2F%40acme%2F%7E%2Fbilling",
    );
  });

  it("returns an empty string when no base is configured", () => {
    expect(hubManageUrl("", { product: "keystone", workspace: "acme" })).toBe(
      "",
    );
  });
});

describe("hubCreditsUrl", () => {
  it("links a pack for one-click checkout, lowercased", () => {
    const url = new URL(
      hubCreditsUrl("https://account.omni.dev/", {
        product: "Facet",
        workspace: "Acme",
        pack: "Credits-2000",
      }),
    );

    expect(url.origin + url.pathname).toBe("https://account.omni.dev/billing");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      product: "facet",
      workspace: "acme",
      pack: "credits-2000",
    });
  });

  it("opens the pack picker when no pack is named", () => {
    expect(hubCreditsUrl("https://account.omni.dev")).toBe(
      "https://account.omni.dev/billing?tab=ai",
    );
    expect(
      hubCreditsUrl("https://account.omni.dev", { product: "beacon" }),
    ).toBe("https://account.omni.dev/billing?product=beacon&tab=ai");
  });

  it("returns an empty string when no base is configured", () => {
    expect(hubCreditsUrl(undefined, { pack: "credits-500" })).toBe("");
  });
});

describe("hubInvoicesUrl", () => {
  it("links a workspace's invoices, lowercased", () => {
    expect(
      hubInvoicesUrl("https://account.omni.dev/", { workspace: "Acme" }),
    ).toBe("https://account.omni.dev/billing?workspace=acme&tab=invoices");
  });

  it("links the personal workspace when none is named", () => {
    expect(hubInvoicesUrl("https://account.omni.dev")).toBe(
      "https://account.omni.dev/billing?tab=invoices",
    );
  });

  it("returns an empty string when no base is configured", () => {
    expect(hubInvoicesUrl(undefined, { workspace: "acme" })).toBe("");
  });
});
