/**
 * Typed gateway errors and their mapping to a client action, shared across
 * products. A product API (facet-api, beacon-gateway, fractal-api) returns a
 * generic, user-safe `error` string with an HTTP status; the client forwards
 * that message verbatim (never inventing or leaking transport detail) and maps
 * the status onto a UI action.
 */

/** A typed gateway error carrying the API's generic message and HTTP status. */
export class GatewayError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
  }
}

/**
 * How a client should react to a failed managed call, derived from the status:
 * - `signIn`: 401, the managed path needs an Omni identity
 * - `outOfCredits`: 402, the monthly credit cap is reached
 * - `notAllowed`: 403, the managed path is gated (e.g. limited-preview whitelist)
 * - `rateLimited`: 429, too many requests
 * - `generic`: anything else, shown as the message the gateway already returned
 */
export type GatewayErrorAction =
  | "signIn"
  | "outOfCredits"
  | "notAllowed"
  | "rateLimited"
  | "generic";

/** Map a gateway HTTP status onto the client's reaction. */
export const classifyGatewayError = (
  status: number | undefined,
): GatewayErrorAction => {
  switch (status) {
    case 401:
      return "signIn";
    case 402:
      return "outOfCredits";
    case 403:
      return "notAllowed";
    case 429:
      return "rateLimited";
    default:
      return "generic";
  }
};
