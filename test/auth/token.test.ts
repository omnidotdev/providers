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
  it("should return current tokens when both access_token and id_token are fresh", async () => {
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

  it("should refresh when access_token is fresh but id_token is expired", async () => {
    const expired = freshAccessToken(
      fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 }),
    );
    const refreshed: TokenResult = {
      accessToken: "new-access",
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      idToken: fakeJwt({ exp: Math.floor(Date.now() / 1000) + 60 }),
    };

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => expired,
      refreshToken: async () => refreshed,
    });

    expect(result).toBe(refreshed);
  });

  it("should refresh when id_token is within leeway buffer", async () => {
    // 3 seconds left, buffer is 5000ms — should trigger refresh
    const almostExpired = freshAccessToken(
      fakeJwt({ exp: Math.floor(Date.now() / 1000) + 3 }),
    );
    const refreshed: TokenResult = {
      accessToken: "new-access",
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      idToken: fakeJwt({ exp: Math.floor(Date.now() / 1000) + 60 }),
    };

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => almostExpired,
      refreshToken: async () => refreshed,
      refreshBufferMs: 5_000,
    });

    expect(result).toBe(refreshed);
  });

  it("should fall back to original token when refresh fails with transient error", async () => {
    const expiredId = freshAccessToken(
      fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 }),
    );

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => expiredId,
      refreshToken: async () => {
        throw new Error("network timeout");
      },
    });

    expect(result).toBe(expiredId);
  });

  it("should propagate invalid_grant error when refresh fails on expired token", async () => {
    const expiredId = freshAccessToken(
      fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 }),
    );

    await expect(
      ensureFreshAccessToken({
        getAccessToken: async () => expiredId,
        refreshToken: async () => {
          throw new Error("invalid_grant");
        },
      }),
    ).rejects.toThrow("invalid_grant");
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

  it("should refresh when accessTokenExpiresAt is missing", async () => {
    const noExpiry: TokenResult = {
      accessToken: "access-tok",
      idToken: fakeJwt({ exp: Math.floor(Date.now() / 1000) + 60 }),
    };
    const refreshed: TokenResult = {
      accessToken: "new-access",
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    const result = await ensureFreshAccessToken({
      getAccessToken: async () => noExpiry,
      refreshToken: async () => refreshed,
    });

    expect(result).toBe(refreshed);
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
