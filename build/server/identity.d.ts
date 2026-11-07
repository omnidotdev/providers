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
/**
 * Resolve the client IP: left-most `x-forwarded-for`, then `x-real-ip`, then
 * the socket address, then `"unknown"`. Proxy headers are skipped when
 * `trustProxy` is `false`.
 */
export declare const clientIp: ({ headers, socketIp, trustProxy, }: IdentitySource) => string;
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
