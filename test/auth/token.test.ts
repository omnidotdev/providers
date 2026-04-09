import { describe, expect, it } from "bun:test";

import { ensureFreshAccessToken, isInvalidGrant } from "../../src/auth/token";

import type { TokenResult } from "../../src/auth/token";

/** Create an unsigned JWT with the given payload for testing */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));

  return `${header}.${body}.fakesig`;
}

function freshAccessToken(idToken?: string | null): TokenResult {
  return {
    accessToken: "access-tok",
    accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    idToken,
  };
}

describe("ensureFreshAccessToken", () => {
  it("should return current tokens when access_token is present", async () => {
    const fresh = freshAccessToken(
      fakeJwt({ exp: Math.floor(Date.now() / 1000) + 60 }),
    );

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => fresh,
      refreshToken: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result).toBe(fresh);
  });

  it("should NOT refresh when access_token is valid but id_token is expired (BA handles refresh internally)", async () => {
    const expiredId = freshAccessToken(
      fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 }),
    );

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => expiredId,
      refreshToken: async () => {
        throw new Error("should not be called");
      },
    });

    // Should return original token; BA's getAccessToken handles refresh internally
    expect(result).toBe(expiredId);
  });

  it("should NOT refresh when accessTokenExpiresAt is missing but access token is present", async () => {
    const noExpiry: TokenResult = {
      accessToken: "access-tok",
      idToken: fakeJwt({ exp: Math.floor(Date.now() / 1000) + 60 }),
    };

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => noExpiry,
      refreshToken: async () => {
        throw new Error("should not be called");
      },
    });

    // With token rotation, forcing a separate refresh is dangerous.
    // BA's getAccessToken handles refresh internally when needed.
    expect(result).toBe(noExpiry);
  });

  it("should skip id_token check when idToken is null", async () => {
    const noId = freshAccessToken(null);

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => noId,
      refreshToken: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result).toBe(noId);
  });

  it("should refresh when accessToken is missing entirely", async () => {
    const noToken: TokenResult = {};
    const refreshed: TokenResult = {
      accessToken: "new-access",
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => noToken,
      refreshToken: async () => refreshed,
    });

    expect(result).toBe(refreshed);
  });

  it("should refresh when getAccessToken returns null", async () => {
    const refreshed: TokenResult = {
      accessToken: "new-access",
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => null,
      refreshToken: async () => refreshed,
    });

    expect(result).toBe(refreshed);
  });

  it("should propagate invalid_grant error when no access token and refresh fails", async () => {
    await expect(
      ensureFreshAccessToken({
        getAccessToken: async () => ({}),
        refreshToken: async () => {
          throw new Error("invalid_grant");
        },
      }),
    ).rejects.toThrow("invalid_grant");
  });

  it("should return original result when refresh fails with transient error", async () => {
    const noToken: TokenResult = {};

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => noToken,
      refreshToken: async () => {
        throw new Error("network timeout");
      },
    });

    expect(result).toBe(noToken);
  });
});

describe("isInvalidGrant", () => {
  it("should detect 'invalid_grant' in error message", () => {
    expect(isInvalidGrant(new Error("invalid_grant"))).toBe(true);
  });

  it("should detect 'invalid refresh token' in error message", () => {
    expect(isInvalidGrant(new Error("invalid refresh token"))).toBe(true);
  });

  it("should detect invalid_grant in error cause", () => {
    const err = new Error("token refresh failed", {
      cause: { error: "invalid_grant" },
    });

    expect(isInvalidGrant(err)).toBe(true);
  });

  it("should return false for unrelated errors", () => {
    expect(isInvalidGrant(new Error("network timeout"))).toBe(false);
  });

  it("should return false for non-Error values", () => {
    expect(isInvalidGrant("invalid_grant")).toBe(false);
    expect(isInvalidGrant(null)).toBe(false);
  });
});
