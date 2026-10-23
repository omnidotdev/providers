import { describe, expect, it } from "bun:test";

import {
  normalizeWorkspaceLinks,
  publicWorkspaceLinks,
} from "./workspaceLinks";

describe("normalizeWorkspaceLinks", () => {
  it("parses the raw JSON string Gatekeeper returns", () => {
    const raw =
      '[{"url":"https://topcrush.app","title":"Website","visibility":"public"},{"url":"https://drive.google.com/x","title":"Team Drive","visibility":"members"}]';
    expect(normalizeWorkspaceLinks(raw)).toEqual([
      { url: "https://topcrush.app", title: "Website", visibility: "public" },
      {
        url: "https://drive.google.com/x",
        title: "Team Drive",
        visibility: "members",
      },
    ]);
  });

  it("passes an already-parsed array through", () => {
    expect(
      normalizeWorkspaceLinks([{ url: "https://a.com", title: "A" }]),
    ).toEqual([{ url: "https://a.com", title: "A", visibility: "public" }]);
  });

  it("defaults a missing or unknown visibility to public", () => {
    expect(normalizeWorkspaceLinks('[{"url":"https://a.com"}]')).toEqual([
      { url: "https://a.com", title: null, visibility: "public" },
    ]);
    expect(
      normalizeWorkspaceLinks([{ url: "https://a.com", visibility: "weird" }]),
    ).toEqual([{ url: "https://a.com", title: null, visibility: "public" }]);
  });

  it("returns [] for null, undefined, non-array, or unparseable input", () => {
    expect(normalizeWorkspaceLinks(null)).toEqual([]);
    expect(normalizeWorkspaceLinks(undefined)).toEqual([]);
    expect(normalizeWorkspaceLinks("not json")).toEqual([]);
    expect(normalizeWorkspaceLinks({ url: "https://a.com" })).toEqual([]);
    expect(normalizeWorkspaceLinks(7)).toEqual([]);
  });

  it("drops entries without a string url", () => {
    expect(
      normalizeWorkspaceLinks(
        '[{"url":"https://ok.com"},{"title":"x"},null,5]',
      ),
    ).toEqual([{ url: "https://ok.com", title: null, visibility: "public" }]);
  });
});

describe("publicWorkspaceLinks", () => {
  it("drops members-only links (leak prevention for public surfaces)", () => {
    const raw =
      '[{"url":"https://pub.com","visibility":"public"},{"url":"https://priv.com","visibility":"members"}]';
    expect(publicWorkspaceLinks(raw)).toEqual([
      { url: "https://pub.com", title: null, visibility: "public" },
    ]);
  });

  it("keeps legacy links with no visibility (treated as public)", () => {
    expect(publicWorkspaceLinks('[{"url":"https://legacy.com"}]')).toEqual([
      { url: "https://legacy.com", title: null, visibility: "public" },
    ]);
  });
});
