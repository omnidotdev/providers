/**
 * Client for an Omni product's AI gateway (facet-api, beacon-gateway,
 * fractal-api), shared across products. The browser never holds a product's
 * managed Synapse key: it POSTs to the product API, which owns that key and all
 * cost controls. A caller's own Synapse key (BYOK) is passed through per-request
 * over TLS and never stored.
 *
 * This covers the one-shot, structured calls (e.g. Facet's `/generate` ->
 * `{ code, usage }`, Fractal's `/draft` -> `{ manifest }`). Streaming chat and
 * the agentic tool loop run through TanStack AI (`@tanstack/ai-react`), whose
 * adapter points at Synapse, not through this client.
 *
 * Every failure surfaces a generic, user-safe message: the gateway's own `error`
 * string forwarded verbatim, or a safe fallback. Transport/internal detail never
 * reaches the caller.
 */
export interface GatewayClientConfig {
    /** Product AI endpoint base URL. When absent, calls throw a not-configured error. */
    baseUrl: string | undefined;
    /**
     * Resolve the managed-path bearer token, or null when signed out. Never called
     * for a BYOK request, which stays anonymous. Typically `ManagedAiAuth.getAccessToken`
     */
    getAccessToken?: () => Promise<string | null>;
    /** Injectable fetch, defaults to the global. */
    fetchImpl?: typeof fetch;
}
export interface GatewayRequestOptions {
    /** A user-supplied Synapse key (BYOK). When set, the call is anonymous and bills the caller. */
    byokKey?: string;
}
export interface GatewayClient {
    /**
     * POST a JSON body to `path` and return the parsed result. On the managed path
     * (no BYOK key) a bearer token is required; with none available the call throws
     * a 401 GatewayError rather than hitting the gateway blindly. Throws a
     * GatewayError carrying the gateway's generic message and status on any failure
     */
    post<TResult>(path: string, body: Record<string, unknown>, opts?: GatewayRequestOptions): Promise<TResult>;
}
/** Create a gateway client bound to a product's AI endpoint base URL. */
export declare const createGatewayClient: (config: GatewayClientConfig) => GatewayClient;
