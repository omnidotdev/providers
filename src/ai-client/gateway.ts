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

import { GatewayError } from "./errors";

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
  post<TResult>(
    path: string,
    body: Record<string, unknown>,
    opts?: GatewayRequestOptions,
  ): Promise<TResult>;
}

// Shown only when the gateway is unreachable or returns no message. Never expose
// a transport error, provider detail, or stack to the user
const NOT_CONFIGURED = "AI generation is not configured.";
const GENERIC_FAILURE = "AI generation failed. Please try again.";
// A managed call with no identity. Carries status 401 so the UI surfaces it as a
// sign-in prompt, the same as the gateway's own 401, without calling it blindly
const SIGN_IN_REQUIRED = "Sign in to generate, or add your own Synapse key.";

/** Read the gateway's generic `error` string, or a safe fallback. */
const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
  } catch {
    // A non-JSON or empty body carries no user-safe message, so fall through
  }
  return GENERIC_FAILURE;
};

/** Create a gateway client bound to a product's AI endpoint base URL. */
export const createGatewayClient = (
  config: GatewayClientConfig,
): GatewayClient => {
  const doFetch = config.fetchImpl ?? fetch;

  return {
    async post<TResult>(
      path: string,
      body: Record<string, unknown>,
      opts: GatewayRequestOptions = {},
    ): Promise<TResult> {
      if (!config.baseUrl) throw new GatewayError(NOT_CONFIGURED);

      const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      const payload: Record<string, unknown> = { ...body };

      // The managed path (no BYOK key) spends our key, so it must carry an Omni
      // identity. A BYOK call stays anonymous and sends no token. With no token
      // available, do not call the gateway blindly: signal sign-in required
      if (opts.byokKey) {
        payload.byokKey = opts.byokKey;
      } else {
        const token = (await config.getAccessToken?.()) ?? null;
        if (!token) throw new GatewayError(SIGN_IN_REQUIRED, 401);
        headers.authorization = `Bearer ${token}`;
      }

      let response: Response;
      try {
        response = await doFetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      } catch {
        // A transport failure detail is internal, so never surface it
        throw new GatewayError(GENERIC_FAILURE);
      }

      if (!response.ok) {
        throw new GatewayError(
          await readErrorMessage(response),
          response.status,
        );
      }

      return (await response.json()) as TResult;
    },
  };
};
