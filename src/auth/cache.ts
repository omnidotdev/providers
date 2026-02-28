import { EncryptJWT, jwtDecrypt } from "jose";

import type { JWTDecryptResult } from "jose";
import type { OrganizationClaim } from "./types";

/** Cached auth data stored in an encrypted cookie */
type CachedAuthData = {
  rowId: string;
  identityProviderId: string;
  organizations: OrganizationClaim[];
};

type AuthCacheConfig = {
  /** App name used to derive cookie name and HKDF salt */
  appName: string;
};

type AuthCache = {
  /** Encrypt auth data for cookie storage */
  encrypt: (data: CachedAuthData) => Promise<string>;
  /** Decrypt an encrypted cookie value */
  decrypt: (encrypted: string) => Promise<CachedAuthData | null>;
  /** Cookie name: `${appName}_rowid_cache` */
  cookieName: string;
  /** Cookie TTL in seconds (7 days) */
  cookieTtlSeconds: number;
};

const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Derive a 256-bit key from a secret string using HKDF-SHA256.
 */
async function deriveKeyFromSecret(
  secret: string,
  salt: string,
  info: string,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "HKDF",
    false,
    ["deriveBits"],
  );

  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: encoder.encode(salt),
        info: encoder.encode(info),
      },
      keyMaterial,
      256,
    ),
  );
}

/**
 * Parse a decrypted JWE payload into CachedAuthData.
 */
function parseCachePayload(
  payload: JWTDecryptResult["payload"],
): CachedAuthData | null {
  if (
    typeof payload.rowId !== "string" ||
    typeof payload.identityProviderId !== "string"
  ) {
    return null;
  }

  return {
    rowId: payload.rowId,
    identityProviderId: payload.identityProviderId,
    organizations: Array.isArray(payload.organizations)
      ? (payload.organizations as OrganizationClaim[])
      : [],
  };
}

/**
 * Create an encrypted auth cookie cache.
 * Uses HKDF key derivation from `AUTH_SECRET` with `AUTH_SECRET_PREVIOUS`
 * rotation support.
 * @param config - Cache configuration
 * @returns Auth cache with encrypt, decrypt, cookieName, cookieTtlSeconds
 */
function createAuthCache(config: AuthCacheConfig): AuthCache {
  const cookieName = `${config.appName}_rowid_cache`;
  const salt = `${config.appName}-rowid-cache`;

  function getKey(): Promise<Uint8Array> {
    const { AUTH_SECRET } = process.env;
    if (!AUTH_SECRET) throw new Error("AUTH_SECRET not configured");

    return deriveKeyFromSecret(AUTH_SECRET, salt, "encryption-key");
  }

  async function encrypt(data: CachedAuthData): Promise<string> {
    const key = await getKey();

    return new EncryptJWT({
      rowId: data.rowId,
      identityProviderId: data.identityProviderId,
      organizations: data.organizations,
    })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime(`${COOKIE_TTL_SECONDS}s`)
      .encrypt(key);
  }

  async function decrypt(
    encrypted: string,
  ): Promise<CachedAuthData | null> {
    // Try current key
    try {
      const key = await getKey();
      const { payload } = await jwtDecrypt(encrypted, key);

      return parseCachePayload(payload);
    } catch {
      // Fall through to previous key
    }

    // Try previous key for rotation support
    const { AUTH_SECRET_PREVIOUS } = process.env;
    if (!AUTH_SECRET_PREVIOUS) return null;

    try {
      const previousKey = await deriveKeyFromSecret(
        AUTH_SECRET_PREVIOUS,
        salt,
        "encryption-key",
      );
      const { payload } = await jwtDecrypt(encrypted, previousKey);

      return parseCachePayload(payload);
    } catch {
      return null;
    }
  }

  return {
    encrypt,
    decrypt,
    cookieName,
    cookieTtlSeconds: COOKIE_TTL_SECONDS,
  };
}

export { createAuthCache };

export type { AuthCache, AuthCacheConfig, CachedAuthData };
