import { describe, expect, test } from "bun:test";

import { clientIpKey, identityKey } from "./identity";

/** Build an unsigned-decodable JWT (header.payload.signature) for a payload. */
const makeJwt = (payload: Record<string, unknown>): string => {
  const b64 = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "none", typ: "JWT" })}.${b64(payload)}.sig`;
};

/** Minimal headers-like source from a plain record (case-insensitive get). */
const headers = (record: Record<string, string>) => ({
  get: (name: string) => record[name.toLowerCase()] ?? null,
});

describe("identityKey", () => {
  test("returns user:<sub> from a valid Bearer JWT", () => {
    const token = makeJwt({ sub: "idp-user-123" });
    const key = identityKey({
      headers: headers({ authorization: `Bearer ${token}` }),
    });
    expect(key).toBe("user:idp-user-123");
  });

  test("falls back to IP when there is no authorization header", () => {
    const key = identityKey({
      headers: headers({ "x-forwarded-for": "203.0.113.7" }),
    });
    expect(key).toBe("ip:203.0.113.7");
  });

  test("falls back to IP when the JWT is malformed", () => {
    const key = identityKey({
      headers: headers({
        authorization: "Bearer not-a-jwt",
        "x-real-ip": "198.51.100.4",
      }),
    });
    expect(key).toBe("ip:198.51.100.4");
  });

  test("falls back to IP when the JWT has no sub claim", () => {
    const token = makeJwt({ aud: "halo" });
    const key = identityKey({
      headers: headers({
        authorization: `Bearer ${token}`,
        "x-real-ip": "198.51.100.9",
      }),
    });
    expect(key).toBe("ip:198.51.100.9");
  });
});

describe("clientIpKey", () => {
  test("uses the left-most x-forwarded-for entry", () => {
    const key = clientIpKey({
      headers: headers({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" }),
    });
    expect(key).toBe("ip:203.0.113.1");
  });

  test("uses x-real-ip when no forwarded-for header is present", () => {
    const key = clientIpKey({
      headers: headers({ "x-real-ip": "203.0.113.2" }),
    });
    expect(key).toBe("ip:203.0.113.2");
  });

  test("uses the socket IP when no proxy headers are present", () => {
    const key = clientIpKey({ headers: headers({}), socketIp: "203.0.113.3" });
    expect(key).toBe("ip:203.0.113.3");
  });

  test("returns ip:unknown when nothing identifies the client", () => {
    const key = clientIpKey({ headers: headers({}) });
    expect(key).toBe("ip:unknown");
  });

  test("ignores proxy headers when trustProxy is false", () => {
    const key = clientIpKey({
      headers: headers({ "x-forwarded-for": "203.0.113.1" }),
      socketIp: "10.0.0.5",
      trustProxy: false,
    });
    expect(key).toBe("ip:10.0.0.5");
  });
});
