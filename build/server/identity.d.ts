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
/**
 * Resolve the client IP, falling back to the socket address, then `"unknown"`.
 *
 * - `trustProxy: false`: socket address only
 * - `trustedProxyHops` set: the `x-forwarded-for` entry that many positions from
 *   the right (spoof-resistant, see `IdentitySource.trustedProxyHops`)
 * - otherwise (legacy, spoofable): left-most `x-forwarded-for`, then
 *   `x-real-ip`
 */
export declare const clientIp: ({ headers, socketIp, trustProxy, trustedProxyHops, }: IdentitySource) => string;
/** Bucket key for the client IP, prefixed `ip:`. */
export declare const clientIpKey: (source: IdentitySource) => string;
/**
 * Stable per-identity bucket key.
 *
 * Authenticated requests key on the Bearer JWT `sub` (`user:<sub>`), decoded
 * without signature verification since keying only needs a stable value; a
 * forged `sub` merely rate-limits the attacker under that fake identity.
 * Everything else falls back to the client IP (`ip:<addr>`).
 */
export declare const identityKey: (source: IdentitySource) => string;
