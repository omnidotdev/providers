import { describe, expect, test } from "bun:test";

import { clientIp, clientIpKey, identityKey } from "./identity";

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

describe("clientIp with trustedProxyHops", () => {
  test("one hop uses the entry the trusted proxy appended", () => {
    const ip = clientIp({
      headers: headers({ "x-forwarded-for": "203.0.113.10" }),
      trustedProxyHops: 1,
    });
    expect(ip).toBe("203.0.113.10");
  });

  test("a spoofed left-most entry does not change the derived IP", () => {
    const real = "203.0.113.20";
    const derived = ["198.51.100.1", "198.51.100.2", "10.0.0.1, 192.0.2.9"].map(
      (spoof) =>
        clientIp({
          headers: headers({ "x-forwarded-for": `${spoof}, ${real}` }),
          trustedProxyHops: 1,
        }),
    );
    expect(derived).toEqual([real, real, real]);
  });

  test("a spoofed left-most entry does not mint a fresh bucket key", () => {
    const keys = new Set(
      Array.from({ length: 5 }, (_, i) =>
        clientIpKey({
          headers: headers({
            "x-forwarded-for": `198.51.100.${i}, 203.0.113.21`,
          }),
          trustedProxyHops: 1,
        }),
      ),
    );
    expect([...keys]).toEqual(["ip:203.0.113.21"]);
  });

  test("two hops skips the outer proxy and reads the client it saw", () => {
    const ip = clientIp({
      headers: headers({
        "x-forwarded-for": "198.51.100.66, 203.0.113.30, 172.70.1.1",
      }),
      trustedProxyHops: 2,
    });
    expect(ip).toBe("203.0.113.30");
  });

  test("a chain shorter than the hop count uses the left-most entry", () => {
    const ip = clientIp({
      headers: headers({ "x-forwarded-for": "203.0.113.40" }),
      trustedProxyHops: 2,
    });
    expect(ip).toBe("203.0.113.40");
  });

  test("ignores blank entries and surrounding whitespace", () => {
    const ip = clientIp({
      headers: headers({
        "x-forwarded-for": " 198.51.100.1 ,, 203.0.113.50 , ",
      }),
      trustedProxyHops: 1,
    });
    expect(ip).toBe("203.0.113.50");
  });

  test("ignores a client-sent x-real-ip and falls back to the socket", () => {
    const ip = clientIp({
      headers: headers({ "x-real-ip": "198.51.100.99" }),
      socketIp: "10.0.0.7",
      trustedProxyHops: 1,
    });
    expect(ip).toBe("10.0.0.7");
  });

  test("zero or invalid hop counts use the socket address only", () => {
    for (const trustedProxyHops of [0, -1, 1.5, Number.NaN]) {
      const ip = clientIp({
        headers: headers({ "x-forwarded-for": "198.51.100.1, 203.0.113.60" }),
        socketIp: "10.0.0.8",
        trustedProxyHops,
      });
      expect(ip).toBe("10.0.0.8");
    }
  });

  test("trustProxy false wins over trustedProxyHops", () => {
    const ip = clientIp({
      headers: headers({ "x-forwarded-for": "203.0.113.70" }),
      socketIp: "10.0.0.9",
      trustProxy: false,
      trustedProxyHops: 1,
    });
    expect(ip).toBe("10.0.0.9");
  });

  test("identityKey falls back to the hop-aware client IP", () => {
    const key = identityKey({
      headers: headers({ "x-forwarded-for": "198.51.100.1, 203.0.113.80" }),
      trustedProxyHops: 1,
    });
    expect(key).toBe("ip:203.0.113.80");
  });
});
