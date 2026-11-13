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
   * When `false`, only the socket address is used and `trustedProxyHops` is
   * ignored.
   */
  trustProxy?: boolean;
  /**
   * Number of trusted reverse proxies in front of the service that each append
   * the peer address they saw to `x-forwarded-for` (e.g. `1` for a single
   * Envoy/Gateway with `use_remote_address`, `2` for a CDN in front of that).
   *
   * When set, the client IP is read from the right of `x-forwarded-for`,
   * skipping the entries the trusted proxies wrote: the entry `trustedProxyHops`
   * positions from the right end. Entries further left were supplied by the
   * client and are never used, so rotating them cannot mint fresh rate-limit
   * buckets. `x-real-ip` is ignored in this mode (a proxy that only appends to
   * `x-forwarded-for` passes a client-sent `x-real-ip` through untouched).
   * With no `x-forwarded-for`, or `0`, the socket address is used.
   *
   * When omitted, the legacy left-most `x-forwarded-for` behavior applies. That
   * entry is client-controlled behind any appending proxy, so set this option
   * on every service whose proxy topology is known.
   */
  trustedProxyHops?: number;
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

/** Non-empty, trimmed entries of a comma-separated header, in order. */
const csvEntries = (value: string | null): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

/**
 * Client IP from `x-forwarded-for` given a count of trusted appending proxies.
 *
 * Each trusted proxy appends the address of the peer it received the request
 * from, so the last `hops` entries were written by trusted infrastructure and
 * the left-most of those is the address the outermost trusted proxy saw: the
 * real client. When the chain is shorter than `hops` (the request skipped some
 * proxies), every entry is proxy-written and the left-most one is used
 */
const rightmostUntrusted = (
  value: string | null,
  hops: number,
): string | undefined => {
  const entries = csvEntries(value);
  if (entries.length === 0) return undefined;

  return entries[Math.max(0, entries.length - hops)];
};

/** Normalize a hop count: anything but a positive integer means no proxies */
const normalizeHops = (hops: number): number =>
  Number.isInteger(hops) && hops > 0 ? hops : 0;

/**
 * Resolve the client IP, falling back to the socket address, then `"unknown"`.
 *
 * - `trustProxy: false`: socket address only
 * - `trustedProxyHops` set: the `x-forwarded-for` entry that many positions from
 *   the right (spoof-resistant, see `IdentitySource.trustedProxyHops`)
 * - otherwise (legacy, spoofable): left-most `x-forwarded-for`, then
 *   `x-real-ip`
 */
export const clientIp = ({
  headers,
  socketIp,
  trustProxy = true,
  trustedProxyHops,
}: IdentitySource): string => {
  if (trustProxy && trustedProxyHops !== undefined) {
    const hops = normalizeHops(trustedProxyHops);
    if (hops > 0) {
      const forwarded = rightmostUntrusted(
        headers.get("x-forwarded-for"),
        hops,
      );
      if (forwarded) return forwarded;
    }
  } else if (trustProxy) {
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
