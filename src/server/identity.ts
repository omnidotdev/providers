/**
 * Request-identity extraction for rate limiting and abuse keying.
 *
 * Framework-agnostic: works with any headers-like object exposing a
 * case-insensitive `get` (the Web `Headers` interface, Elysia, etc.). The host
 * passes the socket address separately when it has one.
 */

/** A headers-like object exposing a case-insensitive `get`. */
export interface HeadersLike {
  get(name: string): string | null;
}

/** Inputs for deriving a stable client identity from a request. */
export interface IdentitySource {
  /** Request headers (Web `Headers` or any case-insensitive `get`). */
  headers: HeadersLike;
  /** Socket peer address, when the host framework can supply one. */
  socketIp?: string | null;
  /**
   * Whether to trust `x-forwarded-for` / `x-real-ip`. Defaults to `true` to
   * match the fleet's current proxied deployments. Set `false` for a service
   * exposed directly to the internet, where those headers are client-spoofable.
   */
  trustProxy?: boolean;
}

/** Decode a JWT payload without verifying the signature. Returns null on any error. */
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const segment = token.split(".")[1];
  if (!segment) return null;
  try {
    const json = Buffer.from(segment, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
};

/** First non-empty, trimmed value from a comma-separated header. */
const firstCsv = (value: string | null): string | undefined => {
  const first = value?.split(",")[0]?.trim();
  return first ? first : undefined;
};

/**
 * Resolve the client IP: left-most `x-forwarded-for`, then `x-real-ip`, then
 * the socket address, then `"unknown"`. Proxy headers are skipped when
 * `trustProxy` is `false`.
 */
export const clientIp = ({
  headers,
  socketIp,
  trustProxy = true,
}: IdentitySource): string => {
  if (trustProxy) {
    const forwarded = firstCsv(headers.get("x-forwarded-for"));
    if (forwarded) return forwarded;

    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  const socket = socketIp?.trim();
  if (socket) return socket;

  return "unknown";
};

/** Bucket key for the client IP, prefixed `ip:`. */
export const clientIpKey = (source: IdentitySource): string =>
  `ip:${clientIp(source)}`;

/**
 * Stable per-identity bucket key.
 *
 * Authenticated requests key on the Bearer JWT `sub` (`user:<sub>`), decoded
 * without signature verification since keying only needs a stable value; a
 * forged `sub` merely rate-limits the attacker under that fake identity.
 * Everything else falls back to the client IP (`ip:<addr>`).
 */
export const identityKey = (source: IdentitySource): string => {
  const auth = source.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) {
      const sub = decodeJwtPayload(token)?.sub;
      if (typeof sub === "string" && sub.length > 0) return `user:${sub}`;
    }
  }
  return clientIpKey(source);
};
