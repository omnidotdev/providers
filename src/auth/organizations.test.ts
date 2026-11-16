import { afterEach, describe, expect, it, mock } from "bun:test";

import {
  createOrganizationHydrator,
  isSlimOrganizationClaim,
} from "./organizations";
import { OMNI_CLAIMS_NAMESPACE } from "./types";

import type { OrganizationClaim, UserInfoClaims } from "./types";

const SUB = "user-1";

const richOrgs: OrganizationClaim[] = [
  {
    id: "org-1",
    name: "Personal",
    slug: "me",
    type: "personal",
    roles: ["owner"],
    teams: [],
  },
  {
    id: "org-2",
    name: "Acme",
    slug: "acme",
    type: "team",
    roles: ["admin"],
    teams: [{ id: "team-1", name: "Core" }],
  },
];

/** The slim shape tokens carry once the issuer slims the claim */
const slimOrgs = richOrgs.map(({ id }) => ({ id }));

const idToken = (orgs: unknown, sub: string = SUB) => ({
  sub,
  [OMNI_CLAIMS_NAMESPACE]: orgs,
});

const userInfo = (
  orgs: unknown = richOrgs,
  sub: string = SUB,
): UserInfoClaims => ({ sub, [OMNI_CLAIMS_NAMESPACE]: orgs }) as UserInfoClaims;

const makeHydrator = (
  info: () => Promise<UserInfoClaims> = async () => userInfo(),
  extra: { ttlMs?: number; maxEntries?: number } = {},
) => {
  let clock = 1_000;
  const fetchUserInfo = mock(info);
  const hydrator = createOrganizationHydrator({
    fetchUserInfo,
    now: () => clock,
    ...extra,
  });
  return {
    hydrator,
    fetchUserInfo,
    advance: (ms: number) => {
      clock += ms;
    },
  };
};

describe("isSlimOrganizationClaim", () => {
  it("is false for the rich shape", () => {
    expect(isSlimOrganizationClaim(richOrgs)).toBe(false);
  });

  it("is true for ids only", () => {
    expect(isSlimOrganizationClaim(slimOrgs)).toBe(true);
  });
});

describe("createOrganizationHydrator.resolve", () => {
  it("returns a rich token claim as-is without a userinfo round-trip", async () => {
    const { hydrator, fetchUserInfo } = makeHydrator();

    expect(await hydrator.resolve(idToken(richOrgs), "at")).toEqual(richOrgs);
    expect(fetchUserInfo).not.toHaveBeenCalled();
  });

  it("hydrates a slim token claim (ids only) from userinfo", async () => {
    const { hydrator, fetchUserInfo } = makeHydrator();

    expect(await hydrator.resolve(idToken(slimOrgs), "at")).toEqual(richOrgs);
    expect(fetchUserInfo).toHaveBeenCalledTimes(1);
    expect(fetchUserInfo).toHaveBeenCalledWith("at");
  });

  it("returns the same shape for full and slim claims", async () => {
    const { hydrator } = makeHydrator();

    const full = await hydrator.resolve(idToken(richOrgs), "at");
    const slim = await hydrator.resolve(idToken(slimOrgs), "at");
    expect(slim).toEqual(full);
  });

  it("caches hydration per subject within the TTL", async () => {
    const { hydrator, fetchUserInfo } = makeHydrator();

    await hydrator.resolve(idToken(slimOrgs), "at");
    await hydrator.resolve(idToken(slimOrgs), "at");
    expect(fetchUserInfo).toHaveBeenCalledTimes(1);
  });

  it("refetches after the TTL expires", async () => {
    const { hydrator, fetchUserInfo, advance } = makeHydrator();

    await hydrator.resolve(idToken(slimOrgs), "at");
    advance(60_001);
    await hydrator.resolve(idToken(slimOrgs), "at");
    expect(fetchUserInfo).toHaveBeenCalledTimes(2);
  });

  it("bypasses the cache on forceRefresh", async () => {
    const { hydrator, fetchUserInfo } = makeHydrator();

    await hydrator.resolve(idToken(slimOrgs), "at");
    await hydrator.resolve(idToken(slimOrgs), "at", { forceRefresh: true });
    expect(fetchUserInfo).toHaveBeenCalledTimes(2);
  });

  it("refetches after forget", async () => {
    const { hydrator, fetchUserInfo } = makeHydrator();

    await hydrator.resolve(idToken(slimOrgs), "at");
    hydrator.forget(SUB);
    await hydrator.resolve(idToken(slimOrgs), "at");
    expect(fetchUserInfo).toHaveBeenCalledTimes(2);
  });

  it("fails closed when userinfo is for another subject (OIDC 5.3.2)", async () => {
    const { hydrator } = makeHydrator(async () =>
      userInfo(richOrgs, "someone-else"),
    );

    expect(await hydrator.resolve(idToken(slimOrgs), "at")).toEqual([]);
  });

  it("fails closed when userinfo errors", async () => {
    const { hydrator } = makeHydrator(async () => {
      throw new Error("boom");
    });

    expect(await hydrator.resolve(idToken(slimOrgs), "at")).toEqual([]);
  });

  it("fails closed without an access token", async () => {
    const { hydrator, fetchUserInfo } = makeHydrator();

    expect(await hydrator.resolve(idToken(slimOrgs), undefined)).toEqual([]);
    expect(fetchUserInfo).not.toHaveBeenCalled();
  });

  it("returns empty when the token carries no organization claim", async () => {
    const { hydrator, fetchUserInfo } = makeHydrator();

    expect(await hydrator.resolve({ sub: SUB }, "at")).toEqual([]);
    expect(fetchUserInfo).not.toHaveBeenCalled();
  });

  it("defaults missing roles and teams to empty arrays", async () => {
    const { hydrator } = makeHydrator();
    const bare = [{ id: "org-3", name: "Bare", slug: "bare" }];

    const [org] = await hydrator.resolve(idToken(bare), "at");
    expect(org?.roles).toEqual([]);
    expect(org?.teams).toEqual([]);
    expect(org?.type).toBe("team");
  });

  it("keeps the cache bounded", async () => {
    let subject = "u1";
    const { hydrator, fetchUserInfo } = makeHydrator(
      async () => userInfo(richOrgs, subject),
      { maxEntries: 1 },
    );

    await hydrator.hydrate("u1", "at");
    // A second subject evicts the first once the bound is reached
    subject = "u2";
    await hydrator.hydrate("u2", "at");
    subject = "u1";
    await hydrator.hydrate("u1", "at");
    expect(fetchUserInfo).toHaveBeenCalledTimes(3);
  });
});

describe("createOrganizationHydrator with userinfoUrl", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("calls the userinfo endpoint with the bearer access token", async () => {
    const fetchMock = mock(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify(userInfo())),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const hydrator = createOrganizationHydrator({
      userinfoUrl: "https://idp.test/oauth2/userinfo",
    });

    expect(await hydrator.resolve(idToken(slimOrgs), "at")).toEqual(richOrgs);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://idp.test/oauth2/userinfo");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer at");
  });

  it("fails closed when the endpoint answers an error", async () => {
    globalThis.fetch = mock(
      async () => new Response("nope", { status: 401 }),
    ) as unknown as typeof fetch;

    const hydrator = createOrganizationHydrator({
      userinfoUrl: "https://idp.test/oauth2/userinfo",
    });

    expect(await hydrator.resolve(idToken(slimOrgs), "at")).toEqual([]);
  });
});
