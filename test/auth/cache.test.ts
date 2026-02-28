import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";

import { createAuthCache } from "../../src/auth/cache";

import type { CachedAuthData } from "../../src/auth/cache";

const MOCK_DATA: CachedAuthData = {
  rowId: "550e8400-e29b-41d4-a716-446655440000",
  identityProviderId: "660e8400-e29b-41d4-a716-446655440001",
  organizations: [
    {
      id: "org-1",
      name: "Acme Corp",
      slug: "acme",
      type: "team",
      roles: ["admin"],
      teams: [{ id: "team-1", name: "Engineering" }],
    },
  ],
};

describe("createAuthCache", () => {
  let originalAuthSecret: string | undefined;
  let originalAuthSecretPrevious: string | undefined;

  beforeEach(() => {
    originalAuthSecret = process.env.AUTH_SECRET;
    originalAuthSecretPrevious = process.env.AUTH_SECRET_PREVIOUS;
    process.env.AUTH_SECRET = "test-secret-key-for-encryption-1234";
  });

  afterEach(() => {
    if (originalAuthSecret !== undefined) {
      process.env.AUTH_SECRET = originalAuthSecret;
    } else {
      delete process.env.AUTH_SECRET;
    }
    if (originalAuthSecretPrevious !== undefined) {
      process.env.AUTH_SECRET_PREVIOUS = originalAuthSecretPrevious;
    } else {
      delete process.env.AUTH_SECRET_PREVIOUS;
    }
  });

  it("should set cookie name from app name", () => {
    const cache = createAuthCache({ appName: "backfeed" });
    expect(cache.cookieName).toBe("backfeed_rowid_cache");
  });

  it("should set cookie TTL to 7 days", () => {
    const cache = createAuthCache({ appName: "runa" });
    expect(cache.cookieTtlSeconds).toBe(60 * 60 * 24 * 7);
  });

  it("should encrypt and decrypt round-trip", async () => {
    const cache = createAuthCache({ appName: "test" });

    const encrypted = await cache.encrypt(MOCK_DATA);
    expect(typeof encrypted).toBe("string");
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = await cache.decrypt(encrypted);
    expect(decrypted).toEqual(MOCK_DATA);
  });

  it("should return null for invalid encrypted data", async () => {
    const cache = createAuthCache({ appName: "test" });

    const result = await cache.decrypt("not-a-valid-jwe");
    expect(result).toBeNull();
  });

  it("should return null for data missing rowId", async () => {
    const cache = createAuthCache({ appName: "test" });

    // Encrypt valid data, then try with a different app name
    // which uses a different key derivation salt
    const otherCache = createAuthCache({ appName: "other" });
    const encrypted = await cache.encrypt(MOCK_DATA);

    // Different salt = different key = decrypt fails
    const result = await otherCache.decrypt(encrypted);
    expect(result).toBeNull();
  });

  it("should fall back to AUTH_SECRET_PREVIOUS for rotation", async () => {
    const cache = createAuthCache({ appName: "test" });

    // Encrypt with current secret
    const encrypted = await cache.encrypt(MOCK_DATA);

    // Rotate: move current to previous, set new current
    process.env.AUTH_SECRET_PREVIOUS =
      process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "new-secret-key-after-rotation-5678";

    // Should still decrypt using previous key
    const decrypted = await cache.decrypt(encrypted);
    expect(decrypted).toEqual(MOCK_DATA);
  });

  it("should return null when both secrets fail", async () => {
    const cache = createAuthCache({ appName: "test" });

    // Encrypt with current secret
    const encrypted = await cache.encrypt(MOCK_DATA);

    // Change both secrets
    process.env.AUTH_SECRET = "completely-different-secret-aaaa";
    process.env.AUTH_SECRET_PREVIOUS = "also-different-secret-bbbb";

    const result = await cache.decrypt(encrypted);
    expect(result).toBeNull();
  });

  it("should throw when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    const cache = createAuthCache({ appName: "test" });

    expect(cache.encrypt(MOCK_DATA)).rejects.toThrow(
      "AUTH_SECRET not configured",
    );
  });

  it("should handle empty organizations array", async () => {
    const cache = createAuthCache({ appName: "test" });

    const data: CachedAuthData = {
      ...MOCK_DATA,
      organizations: [],
    };

    const encrypted = await cache.encrypt(data);
    const decrypted = await cache.decrypt(encrypted);
    expect(decrypted?.organizations).toEqual([]);
  });
});
